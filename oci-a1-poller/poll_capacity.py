#!/usr/bin/env python3
"""One guarded OCI A1 launch attempt with Instagram reporting."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
import urllib.error
import urllib.request
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


CAPACITY_TERMS = (
    "out of host capacity",
    "out of capacity",
    "host capacity",
    "capacity exhausted",
    "capacity unavailable",
)
ACTIVE_STATES = {
    "PROVISIONING",
    "RUNNING",
    "STARTING",
    "STOPPING",
    "STOPPED",
    "RESTARTING",
}


@dataclass(frozen=True)
class Settings:
    config_file: Path
    profile: str
    region: str
    compartment_id: str
    availability_domain: str
    subnet_id: str
    image_id: str
    shape: str
    ocpus: int
    memory_gb: float
    display_name: str
    assign_public_ip: bool
    boot_volume_gb: int | None
    state_file: Path
    report_timezone: str
    instagram_graph_api_base: str
    instagram_api_version: str | None
    instagram_ig_user_id: str | None
    instagram_recipient_id: str | None
    instagram_access_token: str | None
    instagram_timeout_seconds: int


@dataclass(frozen=True)
class PollResult:
    ok: bool
    outcome: str
    status: int | None = None
    code: str | None = None
    message: str = ""
    request_id: str | None = None
    instance_id: str | None = None
    lifecycle_state: str | None = None
    already_complete: bool = False
    timestamp: str = ""


@dataclass(frozen=True)
class NotificationResult:
    ok: bool
    error: str | None


class PollerError(RuntimeError):
    """Expected configuration or service failure."""


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if key:
            os.environ.setdefault(key, value)


def env_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise PollerError(f"missing required setting: {name}")
    return value


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise PollerError(f"{name} must be true or false")


def env_int(name: str, default: int, minimum: int = 1) -> int:
    value = os.getenv(name)
    try:
        parsed = default if value is None else int(value)
    except ValueError as exc:
        raise PollerError(f"{name} must be an integer") from exc
    if parsed < minimum:
        raise PollerError(f"{name} must be at least {minimum}")
    return parsed


def env_float(name: str, default: float, minimum: float = 0.0) -> float:
    value = os.getenv(name)
    try:
        parsed = default if value is None else float(value)
    except ValueError as exc:
        raise PollerError(f"{name} must be a number") from exc
    if parsed < minimum:
        raise PollerError(f"{name} must be at least {minimum}")
    return parsed


def load_settings() -> Settings:
    project_env = Path(__file__).with_name(".env")
    load_dotenv(Path(os.getenv("A1_POLLER_ENV_FILE", project_env)).expanduser())
    state_file = Path(os.getenv("A1_POLLER_STATE_FILE", "state.json")).expanduser()
    if not state_file.is_absolute():
        state_file = Path(__file__).parent / state_file
    boot_volume = os.getenv("OCI_BOOT_VOLUME_GB", "50").strip()
    if boot_volume.lower() in {"", "none", "null"}:
        boot_volume_gb = None
    else:
        try:
            boot_volume_gb = int(boot_volume)
        except ValueError as exc:
            raise PollerError("OCI_BOOT_VOLUME_GB must be an integer or none") from exc
        if boot_volume_gb < 1:
            raise PollerError("OCI_BOOT_VOLUME_GB must be at least 1")
    return Settings(
        config_file=Path(os.getenv("OCI_CONFIG_FILE", "~/.oci/config")).expanduser(),
        profile=os.getenv("OCI_PROFILE", "DEFAULT"),
        region=os.getenv("OCI_REGION", "sa-saopaulo-1"),
        compartment_id=env_required("OCI_COMPARTMENT_ID"),
        availability_domain=env_required("OCI_AVAILABILITY_DOMAIN"),
        subnet_id=env_required("OCI_SUBNET_ID"),
        image_id=env_required("OCI_IMAGE_ID"),
        shape=os.getenv("OCI_SHAPE", "VM.Standard.A1.Flex"),
        ocpus=env_int("OCI_A1_OCPUS", 2),
        memory_gb=env_float("OCI_A1_MEMORY_GB", 12.0),
        display_name=os.getenv("OCI_DISPLAY_NAME", "free-a1-poller"),
        assign_public_ip=env_bool("OCI_ASSIGN_PUBLIC_IP", True),
        boot_volume_gb=boot_volume_gb,
        state_file=state_file,
        report_timezone=os.getenv("REPORT_TIMEZONE", "America/Sao_Paulo"),
        instagram_graph_api_base=os.getenv("INSTAGRAM_GRAPH_API_BASE", "https://graph.instagram.com").rstrip("/"),
        instagram_api_version=os.getenv("INSTAGRAM_API_VERSION") or None,
        instagram_ig_user_id=os.getenv("INSTAGRAM_IG_USER_ID") or None,
        instagram_recipient_id=os.getenv("INSTAGRAM_RECIPIENT_ID") or None,
        instagram_access_token=os.getenv("INSTAGRAM_ACCESS_TOKEN") or None,
        instagram_timeout_seconds=env_int("INSTAGRAM_TIMEOUT_SECONDS", 20),
    )


def now_for(settings: Settings) -> datetime:
    current = datetime.now(timezone.utc)
    try:
        return current.astimezone(ZoneInfo(settings.report_timezone))
    except ZoneInfoNotFoundError:
        return current.astimezone()


def iso_now(settings: Settings) -> str:
    return now_for(settings).isoformat(timespec="seconds")


def load_state(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PollerError(f"cannot read state file {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise PollerError(f"state file {path} must contain a JSON object")
    return value


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(prefix=f"{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            json.dump(state, stream, indent=2, sort_keys=True)
            stream.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


@contextmanager
def run_lock(path: Path):
    lock_path = path.with_name(f"{path.name}.lock")
    try:
        descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError as exc:
        raise PollerError(f"another poll is already running ({lock_path})") from exc
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            stream.write(str(os.getpid()))
        yield
    finally:
        try:
            lock_path.unlink()
        except FileNotFoundError:
            pass


def launch_request_fields(settings: Settings) -> dict[str, Any]:
    source_details: dict[str, Any] = {"source_type": "image", "image_id": settings.image_id}
    if settings.boot_volume_gb is not None:
        source_details["boot_volume_size_in_gbs"] = settings.boot_volume_gb
    return {
        "availability_domain": settings.availability_domain,
        "compartment_id": settings.compartment_id,
        "display_name": settings.display_name,
        "shape": settings.shape,
        "shape_config": {"ocpus": settings.ocpus, "memory_in_gbs": settings.memory_gb},
        "create_vnic_details": {
            "subnet_id": settings.subnet_id,
            "assign_public_ip": settings.assign_public_ip,
        },
        "source_details": source_details,
        "freeform_tags": {"oci_a1_poller": "true"},
    }


def build_oci_details(settings: Settings):
    try:
        import oci
    except ImportError as exc:
        raise PollerError("OCI SDK is not installed; run python -m pip install -r requirements.txt") from exc
    fields = launch_request_fields(settings)
    return oci.core.models.LaunchInstanceDetails(
        availability_domain=fields["availability_domain"],
        compartment_id=fields["compartment_id"],
        display_name=fields["display_name"],
        shape=fields["shape"],
        shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(**fields["shape_config"]),
        create_vnic_details=oci.core.models.CreateVnicDetails(**fields["create_vnic_details"]),
        source_details=oci.core.models.InstanceSourceViaImageDetails(**fields["source_details"]),
        freeform_tags=fields["freeform_tags"],
    )


def build_oci_client(settings: Settings):
    try:
        import oci
    except ImportError as exc:
        raise PollerError("OCI SDK is not installed; run python -m pip install -r requirements.txt") from exc
    if not settings.config_file.is_file():
        raise PollerError(f"OCI config file not found: {settings.config_file}")
    config = oci.config.from_file(str(settings.config_file), settings.profile)
    config["region"] = settings.region
    return oci.core.ComputeClient(config)


def existing_managed_instance(client, settings: Settings):
    try:
        response = client.list_instances(compartment_id=settings.compartment_id)
        instances = response.data
    except Exception as exc:
        raise PollerError(f"could not list existing instances: {exc}") from exc
    for instance in instances:
        tags = getattr(instance, "freeform_tags", None) or {}
        state = str(getattr(instance, "lifecycle_state", "")).upper()
        if tags.get("oci_a1_poller") == "true" and state in ACTIVE_STATES:
            return instance
    return None


def request_id_from(value: Any) -> str | None:
    headers = getattr(value, "headers", None) or {}
    return headers.get("opc-request-id") or headers.get("opc_request_id")


def classify_service_error(error: Any) -> PollResult:
    status = getattr(error, "status", None)
    code = getattr(error, "code", None)
    message = str(getattr(error, "message", error))
    lowered = message.lower()
    outcome = "capacity-unavailable" if any(term in lowered for term in CAPACITY_TERMS) else "service-error"
    return PollResult(
        ok=False,
        outcome=outcome,
        status=status,
        code=code,
        message=message,
        request_id=request_id_from(error),
    )


def result_from_instance(instance, settings: Settings, already_complete: bool = False) -> PollResult:
    return PollResult(
        ok=True,
        outcome="already-provisioned" if already_complete else "provisioning-accepted",
        status=200 if already_complete else None,
        message="managed instance is already present" if already_complete else "OCI accepted the launch request",
        instance_id=getattr(instance, "id", None),
        lifecycle_state=getattr(instance, "lifecycle_state", None),
        already_complete=already_complete,
        timestamp=iso_now(settings),
    )


def result_message(result: PollResult) -> str:
    status = f"HTTP {result.status}" if result.status is not None else "HTTP n/a"
    parts = [
        f"{status} {result.outcome}",
        f"code={result.code}" if result.code else None,
        f"instance={result.instance_id}" if result.instance_id else None,
        f"state={result.lifecycle_state}" if result.lifecycle_state else None,
        f"request_id={result.request_id}" if result.request_id else None,
        result.message.strip() or None,
    ]
    return "; ".join(part for part in parts if part)[:650]


def notification_text(result: PollResult, settings: Settings) -> str:
    emoji = "✅" if result.ok else "❌"
    return (
        f"{emoji} OCI A1 poll\n"
        f"Time: {result.timestamp or iso_now(settings)}\n"
        f"Region: {settings.region}\n"
        f"Shape: {settings.shape} ({settings.ocpus} OCPU, {settings.memory_gb:g} GB)\n"
        f"Result: {result_message(result)}"
    )[:950]


class InstagramNotifier:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.last_result: NotificationResult | None = None

    def send(self, message: str) -> NotificationResult:
        required = {
            "INSTAGRAM_API_VERSION": self.settings.instagram_api_version,
            "INSTAGRAM_IG_USER_ID": self.settings.instagram_ig_user_id,
            "INSTAGRAM_RECIPIENT_ID": self.settings.instagram_recipient_id,
            "INSTAGRAM_ACCESS_TOKEN": self.settings.instagram_access_token,
        }
        missing = [name for name, value in required.items() if not value]
        if missing:
            result = NotificationResult(False, "missing Instagram settings: " + ", ".join(missing))
            self.last_result = result
            return result
        api_version = self.settings.instagram_api_version
        assert api_version is not None
        url = (
            f"{self.settings.instagram_graph_api_base}/"
            f"{api_version.strip('/')}/"
            f"{self.settings.instagram_ig_user_id}/messages"
        )
        payload = {
            "recipient": {"id": self.settings.instagram_recipient_id},
            "message": {"text": message},
        }
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.settings.instagram_access_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.settings.instagram_timeout_seconds) as response:
                if not 200 <= response.status < 300:
                    result = NotificationResult(False, f"Instagram HTTP {response.status}")
                else:
                    result = NotificationResult(True, None)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:400]
            result = NotificationResult(False, f"Instagram HTTP {exc.code}: {body}")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            result = NotificationResult(False, f"Instagram network error: {exc}")
        self.last_result = result
        return result


def poll_once(settings: Settings, client=None, notifier=None, details_builder=None) -> PollResult:
    state = load_state(settings.state_file)
    if state.get("completed"):
        result = PollResult(
            ok=True,
            outcome="already-provisioned",
            status=state.get("status", 200),
            message="success marker is present; no new OCI launch was attempted",
            request_id=state.get("request_id"),
            instance_id=state.get("instance_id"),
            lifecycle_state=state.get("lifecycle_state"),
            already_complete=True,
            timestamp=iso_now(settings),
        )
        if not state.get("notification_delivered", False) and notifier is not None:
            notification = notifier.send(notification_text(result, settings))
            if notification.ok:
                state["notification_delivered"] = True
                save_state(settings.state_file, state)
        return result

    client = client or build_oci_client(settings)
    instance = existing_managed_instance(client, settings)
    if instance is not None:
        result = result_from_instance(instance, settings, already_complete=True)
        save_state(
            settings.state_file,
            {
                "completed": True,
                "instance_id": result.instance_id,
                "lifecycle_state": result.lifecycle_state,
                "status": result.status,
                "completed_at": result.timestamp,
                "notification_delivered": False,
            },
        )
    else:
        try:
            details_builder = details_builder or build_oci_details
            response = client.launch_instance(details_builder(settings))
            status = getattr(response, "status", None)
            if status is not None and not 200 <= status < 300:
                result = PollResult(
                    ok=False,
                    outcome="unexpected-http-status",
                    status=status,
                    message="OCI returned a non-success status without raising a service error",
                    request_id=request_id_from(response),
                    timestamp=iso_now(settings),
                )
                if notifier is not None:
                    notifier.send(notification_text(result, settings))
                return result
            instance = getattr(response, "data", None)
            result = PollResult(
                ok=True,
                outcome="provisioning-accepted",
                status=getattr(response, "status", None),
                message="OCI accepted the launch request",
                request_id=request_id_from(response),
                instance_id=getattr(instance, "id", None),
                lifecycle_state=getattr(instance, "lifecycle_state", None),
                timestamp=iso_now(settings),
            )
            save_state(
                settings.state_file,
                {
                    "completed": True,
                    "instance_id": result.instance_id,
                    "lifecycle_state": result.lifecycle_state,
                    "status": result.status,
                    "request_id": result.request_id,
                    "completed_at": result.timestamp,
                    "notification_delivered": False,
                },
            )
        except Exception as exc:
            if hasattr(exc, "status") and (hasattr(exc, "code") or hasattr(exc, "message")):
                result = classify_service_error(exc)
                result = PollResult(**{**result.__dict__, "timestamp": iso_now(settings)})
            else:
                result = PollResult(
                    ok=False,
                    outcome="poll-error",
                    message=str(exc),
                    timestamp=iso_now(settings),
                )

    if notifier is not None:
        notification = notifier.send(notification_text(result, settings))
        if result.ok and notification.ok:
            state = load_state(settings.state_file)
            state["notification_delivered"] = True
            save_state(settings.state_file, state)
    return result


def print_validation(settings: Settings) -> None:
    fields = launch_request_fields(settings)
    print(json.dumps({
        "config_file": str(settings.config_file),
        "region": settings.region,
        "state_file": str(settings.state_file),
        "launch_request": fields,
        "instagram_configured": all((
            settings.instagram_api_version,
            settings.instagram_ig_user_id,
            settings.instagram_recipient_id,
            settings.instagram_access_token,
        )),
    }, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate", action="store_true", help="validate settings and print the safe launch payload")
    parser.add_argument("--dry-run", action="store_true", help="validate settings without contacting OCI")
    parser.add_argument("--skip-notification", action="store_true", help="do not send the Instagram report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        settings = load_settings()
        if args.validate or args.dry_run:
            print_validation(settings)
            return 0
        notifier = None if args.skip_notification else InstagramNotifier(settings)
        with run_lock(settings.state_file):
            result = poll_once(settings, notifier=notifier)
        print(notification_text(result, settings))
        if notifier is not None and notifier.last_result is not None and not notifier.last_result.ok:
            print(f"❌ Instagram delivery failed: {notifier.last_result.error}")
            return 2 if result.ok else 1
        return 0 if result.ok else 1
    except PollerError as exc:
        print(f"❌ OCI A1 poll\nError: {exc}")
        return 3


if __name__ == "__main__":
    raise SystemExit(main())

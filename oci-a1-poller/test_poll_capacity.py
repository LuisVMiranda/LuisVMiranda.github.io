import json
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import poll_capacity


class FakeComputeClient:
    def __init__(self, launch_response=None, launch_error=None, instances=None):
        self.launch_response = launch_response
        self.launch_error = launch_error
        self.instances = instances or []
        self.launch_calls = 0

    def list_instances(self, compartment_id):
        return SimpleNamespace(data=self.instances)

    def launch_instance(self, details):
        self.launch_calls += 1
        if self.launch_error is not None:
            raise self.launch_error
        return self.launch_response


class FakeNotifier:
    def __init__(self, ok=True):
        self.ok = ok
        self.messages = []

    def send(self, message):
        self.messages.append(message)
        return poll_capacity.NotificationResult(self.ok, None if self.ok else "test failure")


class FakeServiceError(Exception):
    def __init__(self, status, code, message, headers):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.headers = headers


class FakeHTTPResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def settings_for(path):
    return poll_capacity.Settings(
        config_file=Path("config"),
        profile="DEFAULT",
        region="sa-saopaulo-1",
        compartment_id="compartment",
        availability_domain="AD-1",
        subnet_id="subnet",
        image_id="image",
        shape="VM.Standard.A1.Flex",
        ocpus=2,
        memory_gb=12.0,
        display_name="free-a1-poller",
        assign_public_ip=True,
        boot_volume_gb=50,
        state_file=path,
        report_timezone="UTC",
        instagram_graph_api_base="https://graph.instagram.com",
        instagram_api_version="v24.0",
        instagram_ig_user_id=None,
        instagram_recipient_id=None,
        instagram_access_token=None,
        instagram_timeout_seconds=20,
    )


class PollCapacityTests(unittest.TestCase):
    def test_capacity_error_is_classified(self):
        error = SimpleNamespace(
            status=500,
            code="InternalError",
            message="Out of host capacity.",
            headers={"opc-request-id": "req-1"},
        )
        result = poll_capacity.classify_service_error(error)
        self.assertEqual(result.outcome, "capacity-unavailable")
        self.assertEqual(result.status, 500)
        self.assertEqual(result.request_id, "req-1")

    def test_payload_uses_always_free_defaults(self):
        with tempfile.TemporaryDirectory() as directory:
            settings = settings_for(Path(directory) / "state.json")
            fields = poll_capacity.launch_request_fields(settings)
        self.assertEqual(fields["shape"], "VM.Standard.A1.Flex")
        self.assertEqual(fields["shape_config"]["ocpus"], 2)
        self.assertEqual(fields["shape_config"]["memory_in_gbs"], 12.0)
        self.assertTrue(fields["create_vnic_details"]["assign_public_ip"])

    def test_success_saves_instance_and_sends_green_report(self):
        response = SimpleNamespace(
            status=202,
            data=SimpleNamespace(id="instance-1", lifecycle_state="PROVISIONING"),
            headers={"opc-request-id": "req-success"},
        )
        with tempfile.TemporaryDirectory() as directory:
            settings = settings_for(Path(directory) / "state.json")
            notifier = FakeNotifier()
            client = FakeComputeClient(launch_response=response)
            result = poll_capacity.poll_once(settings, client, notifier, lambda _: object())
            state = json.loads(settings.state_file.read_text(encoding="utf-8"))
        self.assertTrue(result.ok)
        self.assertEqual(result.instance_id, "instance-1")
        self.assertEqual(client.launch_calls, 1)
        self.assertTrue(state["completed"])
        self.assertTrue(state["notification_delivered"])
        self.assertTrue(notifier.messages[0].startswith("✅"))

    def test_capacity_failure_sends_red_report_and_does_not_mark_complete(self):
        error = FakeServiceError(
            status=500,
            code="InternalError",
            message="Out of host capacity.",
            headers={"opc-request-id": "req-capacity"},
        )
        with tempfile.TemporaryDirectory() as directory:
            settings = settings_for(Path(directory) / "state.json")
            notifier = FakeNotifier()
            client = FakeComputeClient(launch_error=error)
            result = poll_capacity.poll_once(settings, client, notifier, lambda _: object())
        self.assertFalse(result.ok)
        self.assertEqual(result.outcome, "capacity-unavailable")
        self.assertFalse(settings.state_file.exists())
        self.assertTrue(notifier.messages[0].startswith("❌"))

    def test_existing_managed_instance_is_not_launched_again(self):
        instance = SimpleNamespace(
            id="existing-1",
            lifecycle_state="RUNNING",
            freeform_tags={"oci_a1_poller": "true"},
        )
        with tempfile.TemporaryDirectory() as directory:
            settings = settings_for(Path(directory) / "state.json")
            notifier = FakeNotifier()
            client = FakeComputeClient(instances=[instance])
            result = poll_capacity.poll_once(settings, client, notifier)
        self.assertTrue(result.ok)
        self.assertEqual(result.instance_id, "existing-1")
        self.assertEqual(client.launch_calls, 0)

    def test_instagram_request_uses_scoped_recipient_and_bearer_token(self):
        with tempfile.TemporaryDirectory() as directory:
            settings = replace(
                settings_for(Path(directory) / "state.json"),
                instagram_ig_user_id="ig-account",
                instagram_recipient_id="ig-recipient",
                instagram_access_token="secret-token",
            )
            notifier = poll_capacity.InstagramNotifier(settings)
            with patch("poll_capacity.urllib.request.urlopen", return_value=FakeHTTPResponse()) as opener:
                result = notifier.send("✅ test")
        request = opener.call_args.args[0]
        self.assertTrue(result.ok)
        self.assertEqual(request.full_url, "https://graph.instagram.com/v24.0/ig-account/messages")
        self.assertEqual(json.loads(request.data), {
            "recipient": {"id": "ig-recipient"},
            "message": {"text": "✅ test"},
        })
        self.assertEqual(request.headers["Authorization"], "Bearer secret-token")


if __name__ == "__main__":
    unittest.main()

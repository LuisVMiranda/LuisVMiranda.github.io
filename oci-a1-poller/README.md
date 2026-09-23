OCI A1 capacity poller

This script performs one guarded OCI Compute launch attempt per run. OCI now
documents a `CreateComputeCapacityReport` operation, but this implementation
deliberately follows the requested launch-response polling strategy. A
scheduled run happens once per hour, so the script does not hammer OCI with a
tight retry loop.

Behavior

- Checks the state file and existing instances tagged `oci_a1_poller=true` before
  attempting a launch, preventing duplicate instances after a success.
- Requests `VM.Standard.A1.Flex` with the configured Always Free default of
  2 OCPUs and 12 GB RAM.
- Keep `OCI_REGION` equal to your tenancy home region if you need the Always
  Free entitlement; São Paulo is only the default requested target here.
- Classifies host-capacity errors separately from authentication, quota,
  validation, and network errors.
- Writes a success marker atomically and stops making new launch requests after
  an instance is accepted.
- Formats every attempted result with an emoji, run time, region, status/code,
  OCI request ID, and a bounded service message.
- Sends the formatted report through the Instagram Graph API when configured.
  The API needs an Instagram Professional account, an access token, the
  account's Instagram ID, and the recipient's Instagram-scoped ID. A username
  alone is not enough to address a DM.
- Uses a lock file so overlapping hourly runs cannot launch twice.

Setup

1. Install Python 3.11+ and the OCI SDK:

   python -m pip install -r requirements.txt

2. Copy `.env.example` to `.env` and fill in the OCI values. Never commit `.env`.
   Keep the OCI API-key config at the path in `OCI_CONFIG_FILE`.

3. Fill in the Instagram values. The recipient must have an Instagram-scoped
   identifier that the configured professional account is allowed to message.
   Keep the access token only in `.env` or another secret store.

4. Run a local validation without creating anything:

   python poll_capacity.py --validate

5. Run one real poll only after all values are correct:

   python poll_capacity.py

   The first real run can create an instance if capacity is available. To test
   formatting and dependency wiring without OCI, use:

   python poll_capacity.py --dry-run --skip-notification

Scheduling on this Windows machine

The repository's Hermes gateway is already running. A paused hourly Hermes cron
job is created for this poller when the project is installed. After `.env` and
OCI credentials are ready, resume that job. The job executes the script directly
with no LLM step; the script itself sends Instagram reports.

If you install it elsewhere, schedule this command once per hour with the
working directory set to this folder:

   python poll_capacity.py

Stop behavior

After OCI accepts the launch, the script records the instance OCID in
`state.json`, sends the success report, and makes later hourly runs no-ops. If
Instagram delivery fails, the success marker is retained and the next run retries
only the undelivered report instead of launching another instance.

Safety notes

- Use only a compartment, subnet, image, and shape you control.
- The Always Free entitlement is a tenancy quota, not a guarantee of capacity.
- The script never deletes instances and never retries a failed request inside
  one run.
- Do not put OCI private keys or Instagram tokens in Git, logs, or chat.

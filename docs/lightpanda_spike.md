# Lightpanda spike (fetch_page_text)

## Role

The host can run a **`fetch_page_text`** task that shells out to the [Lightpanda](https://github.com/lightpanda-io/browser) CLI (`lightpanda fetch …`) to render a page and extract plain text. The browser binary is **not** bundled with this repo (keeps the Node kernel small).

## Setup

1. Install a nightly binary (see upstream README) or use Docker (`lightpanda/browser` on port 9222 is for CDP; for this spike we use the **`fetch`** subcommand locally).
2. Set `LIGHTPANDA_PATH` to the absolute path of the `lightpanda` executable, or ensure `lightpanda` is on `PATH`.

Optional: `LIGHTPANDA_DISABLE_TELEMETRY=true` per upstream docs.

## Trigger (rule planner)

Send a natural-language command that includes a URL and intent such as **抓取网页**, **网页正文**, or **fetch page**, for example:

`抓取网页 https://example.com`

## Security

- Only **https** URLs, or **http** on **localhost / 127.0.0.1 / ::1**, are accepted (`host/src/urlPolicy.ts`).
- Tasks still require **approval** like other medium-risk actions.

## License / distribution

Lightpanda is under its own license (see upstream `LICENSE`). Shipping it inside an installer affects compliance (e.g. AGPL considerations discussed in `project_plan/project_plan_v1_1.md`). **Default distribution**: document optional user-installed binary; do not vendor Lightpanda in the minimal host package until legal review.

## Failure modes

If the binary is missing or output contains no HTML, execution fails with a message to configure `LIGHTPANDA_PATH` or verify the URL.

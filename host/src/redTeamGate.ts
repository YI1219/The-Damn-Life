import { isCliArgvAllowed } from "./cliInvokePolicy.js";
import { isPathAllowed } from "./pathPolicy.js";
import { validateTaskPlan } from "./taskPlan.js";
import { isFetchUrlAllowed } from "./urlPolicy.js";

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const checks: Check[] = [];

function add(name: string, passed: boolean, detail: string): void {
  checks.push({ name, passed, detail });
}

// Malformed plans must not validate
add(
  "reject_missing_schema",
  !validateTaskPlan({ taskType: "organize_downloads" }).ok,
  "plan without schemaVersion must fail"
);

add(
  "reject_bad_task_type",
  !validateTaskPlan({
    schemaVersion: 1,
    taskType: "unknown",
    summary: "x",
    requiresApproval: true,
    riskLevel: "low",
    params: {}
  }).ok,
  "unknown taskType must fail"
);

add(
  "reject_path_traversal_downloads",
  !isPathAllowed("/Users/../etc/passwd"),
  "/Users/../etc/passwd must be denied"
);

add(
  "reject_non_whitelisted_home_path",
  !isPathAllowed("/Users/nobody/Secret"),
  "arbitrary home subpath must be denied unless under allowed roots"
);

if (process.env.HOME) {
  add(
    "allow_downloads",
    isPathAllowed(`${process.env.HOME}/Downloads`),
    "Downloads under HOME should be allowed"
  );
} else {
  add("allow_downloads", true, "skipped: HOME unset");
}

add("deny_file_url_fetch", !isFetchUrlAllowed("file:///etc/passwd"), "file: URLs must be denied");

add("deny_javascript_url_fetch", !isFetchUrlAllowed("javascript:alert(1)"), "javascript: URLs must be denied");

add("allow_https_fetch", isFetchUrlAllowed("https://example.com/path"), "https must be allowed");

add("allow_localhost_http_fetch", isFetchUrlAllowed("http://127.0.0.1:8080/"), "http loopback must be allowed");

add("deny_lan_http_fetch", !isFetchUrlAllowed("http://192.168.1.1/"), "http non-loopback must be denied");

{
  const prev = process.env.DAMN_LIFE_CLI_ALLOWLIST;
  delete process.env.DAMN_LIFE_CLI_ALLOWLIST;
  add("cli_invoke_deny_without_allowlist", !isCliArgvAllowed(["echo", "hi"]), "cli_invoke must be denied when DAMN_LIFE_CLI_ALLOWLIST unset");
  process.env.DAMN_LIFE_CLI_ALLOWLIST = "echo";
  add("cli_invoke_allow_when_whitelisted", isCliArgvAllowed(["echo", "hi"]), "echo in allowlist should allow argv");
  add("cli_invoke_reject_shell_meta", !isCliArgvAllowed(["echo", "a;b"]), "argv must reject shell metacharacters");
  if (prev === undefined) {
    delete process.env.DAMN_LIFE_CLI_ALLOWLIST;
  } else {
    process.env.DAMN_LIFE_CLI_ALLOWLIST = prev;
  }
}

add(
  "cli_invoke_plan_validates",
  validateTaskPlan({
    schemaVersion: 1,
    taskType: "cli_invoke",
    summary: "test",
    requiresApproval: true,
    riskLevel: "low",
    params: { argv: ["echo", "x"] }
  }).ok,
  "cli_invoke plan must validate"
);

console.log("Red team gate:");
let all = true;
for (const c of checks) {
  console.log(`- [${c.passed ? "PASS" : "FAIL"}] ${c.name}: ${c.detail}`);
  all &&= c.passed;
}

if (!all) {
  process.exit(1);
}

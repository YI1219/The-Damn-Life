import { basename } from "node:path";

const MAX_ARGV_LEN = 48;
const MAX_ARG_CHAR = 4096;
/** Block shell injection; keep conservative (no subshell, pipes, redirection). */
const ARG_FORBIDDEN = /[\n\r\0]|&&|\|\||[;&`$<>]/;

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Non-empty only when `DAMN_LIFE_CLI_ALLOWLIST` is set (comma-separated basenames or absolute paths). */
export function getCliAllowlist(): string[] {
  return parseAllowlist(process.env.DAMN_LIFE_CLI_ALLOWLIST);
}

/** Allowlist entry matches argv[0]: basename match for short names, exact path for tokens containing `/`. */
function entryMatchesArgv0(entry: string, argv0: string): boolean {
  const e = entry.trim();
  const a = argv0.trim();
  if (!e || !a) {
    return false;
  }
  if (e.includes("/") || e.includes("\\")) {
    return e === a;
  }
  return basename(a) === e;
}

/** True iff argv[0] is allowed by allowlist and argv passes safety checks. */
export function isCliArgvAllowed(argv: string[]): boolean {
  const list = getCliAllowlist();
  if (!list.length || argv.length === 0) {
    return false;
  }
  if (argv.length > MAX_ARGV_LEN) {
    return false;
  }
  const exe = argv[0];
  if (!exe.trim() || ARG_FORBIDDEN.test(exe)) {
    return false;
  }
  const allowed = list.some((t) => entryMatchesArgv0(t, exe));
  if (!allowed) {
    return false;
  }
  for (let i = 1; i < argv.length; i++) {
    const part = argv[i];
    if (typeof part !== "string" || part.length > MAX_ARG_CHAR || ARG_FORBIDDEN.test(part)) {
      return false;
    }
  }
  return true;
}

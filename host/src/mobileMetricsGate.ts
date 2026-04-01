import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function dirSizeBytes(root: string): number {
  let total = 0;
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(cur);
    } catch {
      continue;
    }
    if (st.isFile()) {
      total += st.size;
    } else if (st.isDirectory()) {
      for (const name of readdirSync(cur)) {
        stack.push(join(cur, name));
      }
    }
  }
  return total;
}

const hostDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileDist = join(hostDir, "..", "mobile", "dist");

let size = 0;
try {
  size = dirSizeBytes(mobileDist);
} catch {
  console.log("Mobile metrics: mobile/dist missing — run `npm run build -w mobile` first (skipped).");
  process.exit(0);
}

const maxBytes = Number(process.env.DAMN_LIFE_MAX_MOBILE_DIST_BYTES ?? `${2 * 1024 * 1024}`);
const mb = (size / (1024 * 1024)).toFixed(2);
const maxMb = (maxBytes / (1024 * 1024)).toFixed(2);
const passed = size <= maxBytes;

console.log(`Mobile metrics: mobile/dist ≈ ${mb} MiB (threshold ${maxMb} MiB, override with DAMN_LIFE_MAX_MOBILE_DIST_BYTES)`);
console.log(`- [${passed ? "PASS" : "FAIL"}] mobile_dist_size_under_threshold`);

if (!passed) {
  process.exit(1);
}

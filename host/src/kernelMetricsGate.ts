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
const distDir = join(hostDir, "dist");

let size = 0;
try {
  size = dirSizeBytes(distDir);
} catch {
  console.log("Kernel metrics: dist/ missing — run `npm run build -w host` to measure bundle size (skipped).");
  process.exit(0);
}

const maxBytes = Number(process.env.DAMN_LIFE_MAX_DIST_BYTES ?? `${3 * 1024 * 1024}`);
const mb = (size / (1024 * 1024)).toFixed(2);
const maxMb = (maxBytes / (1024 * 1024)).toFixed(2);
const passed = size <= maxBytes;

console.log(`Kernel metrics: host/dist ≈ ${mb} MiB (threshold ${maxMb} MiB, override with DAMN_LIFE_MAX_DIST_BYTES)`);
console.log(`- [${passed ? "PASS" : "FAIL"}] dist_size_under_threshold`);

if (!passed) {
  process.exit(1);
}

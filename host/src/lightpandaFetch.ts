import { spawn } from "node:child_process";

function htmlToPlainText(html: string): string {
  const noScript = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  const noStyle = noScript.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  const stripped = noStyle.replace(/<[^>]+>/g, " ");
  return stripped.replace(/\s+/g, " ").trim();
}

function sliceHtmlFromOutput(raw: string): string | null {
  const lower = raw.toLowerCase();
  const iDoc = lower.indexOf("<!doctype");
  const iHtml = lower.indexOf("<html");
  const start = iDoc >= 0 ? iDoc : iHtml >= 0 ? iHtml : -1;
  if (start < 0) {
    return null;
  }
  return raw.slice(start);
}

export async function runLightpandaFetch(url: string, timeoutMs = 120_000): Promise<string> {
  const bin = process.env.LIGHTPANDA_PATH ?? "lightpanda";
  const args = ["fetch", "--obey-robots", "--log-level", "error", url];

  const html = await new Promise<string>((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let settled = false;
    const finish = (fn: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      fn();
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() => reject(new Error(`lightpanda fetch timeout after ${timeoutMs}ms`)));
    }, timeoutMs);

    child.stdout?.on("data", (c: Buffer) => {
      out += c.toString("utf8");
    });
    child.stderr?.on("data", (c: Buffer) => {
      err += c.toString("utf8");
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      finish(() => reject(e));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const chunk = out.trim() ? out : err;
      const htmlPart = sliceHtmlFromOutput(chunk);
      if (htmlPart) {
        finish(() => resolve(htmlPart));
        return;
      }
      finish(() =>
        reject(new Error(err.trim() || `lightpanda failed (exit ${code ?? "?"}); set LIGHTPANDA_PATH or verify install`))
      );
    });
  });

  return htmlToPlainText(html);
}

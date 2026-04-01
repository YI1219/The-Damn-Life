/** Allow https, or http limited to loopback (local dev / Lightpanda demos). */

export function isFetchUrlAllowed(rawUrl: string): boolean {
  let u: URL;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  if (u.protocol === "https:") {
    return true;
  }
  if (u.protocol === "http:") {
    const h = u.hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  }
  return false;
}

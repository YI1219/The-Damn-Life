/** CORS Allow-Origin for /health and /api/*. Unset env → "*" (local dev). */
export function getCorsAllowOrigin(): string {
  const v = process.env.DAMN_LIFE_CORS_ORIGIN;
  if (v === undefined || v === "") {
    return "*";
  }
  return v.trim();
}

export function isWsTokenRequired(): boolean {
  return process.env.DAMN_LIFE_REQUIRE_WS_TOKEN === "1" || process.env.DAMN_LIFE_REQUIRE_WS_TOKEN === "true";
}

import { db } from "./db.js";

export function validateSessionToken(sessionId: string, token: string | undefined): boolean {
  if (!token || !token.trim()) {
    return false;
  }
  const row = db.prepare("SELECT ws_token FROM sessions WHERE id=?").get(sessionId) as { ws_token: string | null } | undefined;
  return !!row?.ws_token && row.ws_token === token;
}

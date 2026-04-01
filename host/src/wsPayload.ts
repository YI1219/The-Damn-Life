/** Minimal payload guards — replaces a general-purpose schema library on the hot path. */

export function parsePairConfirm(payload: unknown): { deviceId: string; pairCode: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.deviceId !== "string" || typeof p.pairCode !== "string") return null;
  if (!p.deviceId.trim() || !p.pairCode.trim()) return null;
  return { deviceId: p.deviceId, pairCode: p.pairCode };
}

export function parseTaskCommand(payload: unknown): { sessionId: string; text: string; targetDir?: string; sessionToken?: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.sessionId !== "string" || typeof p.text !== "string") return null;
  if (!p.sessionId.trim() || !p.text.trim()) return null;
  if (p.targetDir !== undefined && typeof p.targetDir !== "string") return null;
  if (p.sessionToken !== undefined && typeof p.sessionToken !== "string") return null;
  return {
    sessionId: p.sessionId,
    text: p.text,
    targetDir: typeof p.targetDir === "string" ? p.targetDir : undefined,
    sessionToken: typeof p.sessionToken === "string" ? p.sessionToken : undefined
  };
}

export function parseApproval(payload: unknown): { taskId: string; approved: boolean; reason?: string; sessionId?: string; sessionToken?: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.taskId !== "string" || !p.taskId.trim()) return null;
  if (typeof p.approved !== "boolean") return null;
  if (p.reason !== undefined && typeof p.reason !== "string") return null;
  if (p.sessionId !== undefined && typeof p.sessionId !== "string") return null;
  if (p.sessionToken !== undefined && typeof p.sessionToken !== "string") return null;
  return {
    taskId: p.taskId,
    approved: p.approved,
    reason: typeof p.reason === "string" ? p.reason : undefined,
    sessionId: typeof p.sessionId === "string" ? p.sessionId : undefined,
    sessionToken: typeof p.sessionToken === "string" ? p.sessionToken : undefined
  };
}

export function parseRetry(payload: unknown): { taskId: string; targetDir?: string; sessionId?: string; sessionToken?: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.taskId !== "string" || !p.taskId.trim()) return null;
  if (p.targetDir !== undefined && typeof p.targetDir !== "string") return null;
  if (p.sessionId !== undefined && typeof p.sessionId !== "string") return null;
  if (p.sessionToken !== undefined && typeof p.sessionToken !== "string") return null;
  return {
    taskId: p.taskId,
    targetDir: typeof p.targetDir === "string" ? p.targetDir : undefined,
    sessionId: typeof p.sessionId === "string" ? p.sessionId : undefined,
    sessionToken: typeof p.sessionToken === "string" ? p.sessionToken : undefined
  };
}

export function parseAuditQuery(payload: unknown): { sessionId?: string; sessionToken?: string } | null {
  if (payload === undefined || payload === null) {
    return {};
  }
  if (typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.sessionId !== undefined && typeof p.sessionId !== "string") return null;
  if (p.sessionToken !== undefined && typeof p.sessionToken !== "string") return null;
  return {
    sessionId: typeof p.sessionId === "string" ? p.sessionId : undefined,
    sessionToken: typeof p.sessionToken === "string" ? p.sessionToken : undefined
  };
}

export function parseHeartbeatPayload(payload: unknown): { sessionId?: string; sessionToken?: string } | null {
  if (payload === undefined || payload === null) {
    return {};
  }
  if (typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.sessionId !== undefined && typeof p.sessionId !== "string") return null;
  if (p.sessionToken !== undefined && typeof p.sessionToken !== "string") return null;
  return {
    sessionId: typeof p.sessionId === "string" ? p.sessionId : undefined,
    sessionToken: typeof p.sessionToken === "string" ? p.sessionToken : undefined
  };
}

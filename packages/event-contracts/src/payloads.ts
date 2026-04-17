import type { GateId, TaskId, WorkspaceId } from './ids'

export type ClientRole = 'remote' | 'host_runtime'

export type AuditActor =
  | { kind: 'remote_user'; subject: string }
  | { kind: 'runtime'; subject: string }
  | { kind: 'system'; subject: string }

export interface SystemPingPayload {
  nonce?: string
}

export interface SystemPongPayload {
  nonce?: string
}

/** First message from a peer after transport connect; relay may use it for pairing. */
export interface SessionJoinPayload {
  clientRole: ClientRole
  /** Desired workspace; server may assign or narrow for MVP single-workspace mode. */
  workspaceId?: WorkspaceId
  /** Optional client capabilities string for future negotiation (opaque). */
  capabilities?: string
}

/** `sessionId` is carried on the envelope for this event (assigned by Runtime or relay policy). */
export interface SessionJoinedPayload {
  workspaceId?: WorkspaceId
}

export interface SessionLeavePayload {
  reason?: string
}

/** Remote or automation submits work to Runtime (orchestration is server-side). */
export interface TaskSubmitPayload {
  /** Client MAY omit; Runtime MUST assign `taskId` in `task.accepted`. */
  clientTaskRef?: string
  intent: string
  metadata?: Record<string, unknown>
}

export interface TaskAcceptedPayload {
  taskId: TaskId
  clientTaskRef?: string
}

export interface TaskStartedPayload {
  taskId: TaskId
}

export interface TaskProgressPayload {
  taskId: TaskId
  step?: string
  /** 0–100 when known; omit if indeterminate. */
  percent?: number
  message?: string
}

export interface TaskCompletedPayload {
  taskId: TaskId
  resultSummary?: string
}

export interface TaskFailedPayload {
  taskId: TaskId
  code: string
  message: string
  retryable?: boolean
}

export interface ApprovalRequestedPayload {
  approvalId: GateId
  taskId?: TaskId
  prompt: string
  options?: string[]
}

export interface ApprovalRespondPayload {
  approvalId: GateId
  decision: 'grant' | 'deny'
  reason?: string
}

/** Runtime reports an auditable action (append-only semantics on consumer side). */
export interface AuditRecordPayload {
  auditId: string
  taskId?: TaskId
  actor: AuditActor
  action: string
  resource?: string
  outcome: 'success' | 'failure' | 'denied'
  detail?: Record<string, unknown>
}

/** Explicit permission gate: Runtime or host policy requests a decision. */
export interface PermissionRequestedPayload {
  permissionId: GateId
  taskId?: TaskId
  scope: string
  prompt: string
}

export interface PermissionResolvedPayload {
  permissionId: GateId
  decision: 'grant' | 'deny'
  reason?: string
}

export interface SkillInvokedPayload {
  skillId: string
  taskId?: TaskId
  /** Non-sensitive fingerprint of inputs; never ship secrets. */
  argsDigest?: string
}

export interface SkillCompletedPayload {
  skillId: string
  taskId?: TaskId
  durationMs?: number
}

export interface SkillFailedPayload {
  skillId: string
  taskId?: TaskId
  code: string
  message: string
}

export interface SystemErrorPayload {
  code: string
  message: string
  /** When true, client SHOULD NOT retry without user action. */
  fatal?: boolean
}

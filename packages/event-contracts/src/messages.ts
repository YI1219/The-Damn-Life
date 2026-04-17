import type { WireEnvelopeBase } from './envelope'
import type {
  ApprovalRequestedPayload,
  ApprovalRespondPayload,
  AuditRecordPayload,
  PermissionRequestedPayload,
  PermissionResolvedPayload,
  SessionJoinPayload,
  SessionJoinedPayload,
  SessionLeavePayload,
  SkillCompletedPayload,
  SkillFailedPayload,
  SkillInvokedPayload,
  SystemErrorPayload,
  SystemPingPayload,
  SystemPongPayload,
  TaskAcceptedPayload,
  TaskCompletedPayload,
  TaskFailedPayload,
  TaskProgressPayload,
  TaskStartedPayload,
  TaskSubmitPayload,
} from './payloads'

export const EVENT_TYPES = [
  'system.ping',
  'system.pong',
  'system.error',
  'session.join',
  'session.joined',
  'session.leave',
  'task.submit',
  'task.accepted',
  'task.started',
  'task.progress',
  'task.completed',
  'task.failed',
  'approval.requested',
  'approval.respond',
  'audit.record',
  'permission.requested',
  'permission.resolved',
  'skill.invoked',
  'skill.completed',
  'skill.failed',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

type Msg<T extends EventType, P> = WireEnvelopeBase & { type: T; payload: P }

/** Discriminated by `type`. For `session.joined`, set non-empty `sessionId` on the envelope. */
export type WsMessage =
  | Msg<'system.ping', SystemPingPayload>
  | Msg<'system.pong', SystemPongPayload>
  | Msg<'system.error', SystemErrorPayload>
  | Msg<'session.join', SessionJoinPayload>
  | Msg<'session.joined', SessionJoinedPayload>
  | Msg<'session.leave', SessionLeavePayload>
  | Msg<'task.submit', TaskSubmitPayload>
  | Msg<'task.accepted', TaskAcceptedPayload>
  | Msg<'task.started', TaskStartedPayload>
  | Msg<'task.progress', TaskProgressPayload>
  | Msg<'task.completed', TaskCompletedPayload>
  | Msg<'task.failed', TaskFailedPayload>
  | Msg<'approval.requested', ApprovalRequestedPayload>
  | Msg<'approval.respond', ApprovalRespondPayload>
  | Msg<'audit.record', AuditRecordPayload>
  | Msg<'permission.requested', PermissionRequestedPayload>
  | Msg<'permission.resolved', PermissionResolvedPayload>
  | Msg<'skill.invoked', SkillInvokedPayload>
  | Msg<'skill.completed', SkillCompletedPayload>
  | Msg<'skill.failed', SkillFailedPayload>

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value)
}

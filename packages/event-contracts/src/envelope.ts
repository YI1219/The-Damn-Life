import type {
  CorrelationId,
  SessionId,
  TraceId,
  WorkspaceId,
} from './ids'

/** ISO 8601 timestamp string (UTC recommended). */
export type Iso8601Timestamp = string

/**
 * Fields common to every application-level WebSocket message.
 * Relay SHOULD forward this envelope end-to-end without interpreting `payload`.
 */
export interface WireEnvelopeBase {
  /**
   * Semver of the contract bundle. Emit {@link CONTRACT_VERSION} from `./version` when sending.
   * Typed as string so newer peers can speak minor contract bumps without TS churn.
   */
  contractVersion: string
  timestamp: Iso8601Timestamp
  traceId: TraceId
  correlationId?: CorrelationId
  /**
   * When set, associates the message with a relay-scoped session.
   * Required for most messages after `session.join` completes.
   */
  sessionId?: SessionId
  /** Logical workspace; omit only in pre-join or single-workspace MVP shortcuts. */
  workspaceId?: WorkspaceId
}

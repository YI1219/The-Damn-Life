/** Correlation identifier for request/response or causally linked events (often UUID). */
export type CorrelationId = string

/** End-to-end tracing id (often UUID). */
export type TraceId = string

/** Logical session binding remote and host sides through the relay (opaque string). */
export type SessionId = string

/** Logical workspace; optional in early MVP when only one workspace exists. */
export type WorkspaceId = string

/** Task identifier assigned by Runtime when accepting work. */
export type TaskId = string

/** Stable id for an approval or permission gate. */
export type GateId = string

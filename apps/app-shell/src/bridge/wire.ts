import {
  CONTRACT_VERSION,
  type WireEnvelopeBase,
  isEventType,
  type WsMessage,
} from '@the-damn-life/event-contracts'

export function newTraceId(): string {
  return crypto.randomUUID()
}

export function isoTimestamp(): string {
  return new Date().toISOString()
}

export function wireBase(
  fields: Partial<
    Pick<
      WireEnvelopeBase,
      'correlationId' | 'sessionId' | 'workspaceId' | 'traceId'
    >
  > = {},
): Pick<
  WireEnvelopeBase,
  'contractVersion' | 'timestamp' | 'traceId'
> &
  Partial<
    Pick<
      WireEnvelopeBase,
      'correlationId' | 'sessionId' | 'workspaceId'
    >
  > {
  const { traceId: traceIdOverride, ...rest } = fields
  return {
    contractVersion: CONTRACT_VERSION,
    timestamp: isoTimestamp(),
    traceId: traceIdOverride ?? newTraceId(),
    ...rest,
  }
}

export function parseWsText(data: string):
  | { ok: true; message: WsMessage }
  | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(data) as unknown
  } catch {
    return { ok: false, error: 'invalid json' }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'message not an object' }
  }
  const o = parsed as Record<string, unknown>
  const type = o.type
  if (typeof type !== 'string' || !isEventType(type)) {
    return { ok: false, error: 'unknown or missing event type' }
  }
  return { ok: true, message: o as unknown as WsMessage }
}

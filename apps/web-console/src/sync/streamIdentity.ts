/** Best-effort identity hints from relay envelopes (mirror rows or live wire). */

const HOST_ID_RE =
  /\bhostId=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i

export function extractHostIdFromCapabilities(
  capabilities: unknown,
): string | undefined {
  if (typeof capabilities !== 'string') return undefined
  const m = capabilities.match(HOST_ID_RE)
  return m?.[1]
}

export function readEnvelopePayload(
  envelope: Record<string, unknown>,
): Record<string, unknown> {
  const p = envelope.payload
  if (p && typeof p === 'object') return p as Record<string, unknown>
  return {}
}

export function identityHintsFromEnvelope(envelope: Record<string, unknown>): {
  hostId?: string
  clientRole?: string
} {
  const payload = readEnvelopePayload(envelope)
  const hostId = extractHostIdFromCapabilities(payload.capabilities)
  const clientRole =
    typeof payload.clientRole === 'string' ? payload.clientRole : undefined
  return {
    ...(hostId ? { hostId } : {}),
    ...(clientRole ? { clientRole } : {}),
  }
}

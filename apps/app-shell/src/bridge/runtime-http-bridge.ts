import type { WsMessage } from '@the-damn-life/event-contracts'

function normalizeBase(url: string): string {
  return url.replace(/\/$/, '')
}

/**
 * POST one contract-shaped envelope to runtime-py `bridge_http` and collect NDJSON emits.
 */
export async function forwardEnvelopeToRuntime(
  baseUrl: string,
  envelope: WsMessage,
): Promise<WsMessage[]> {
  const res = await fetch(`${normalizeBase(baseUrl)}/handle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  })
  if (!res.ok) {
    throw new Error(`runtime bridge HTTP ${res.status}`)
  }
  const text = await res.text()
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.map((ln) => JSON.parse(ln) as WsMessage)
}

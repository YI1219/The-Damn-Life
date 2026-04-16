export type StoredEventRow = {
  seq: number
  receivedAt: string
  workspaceId: string
  sessionId?: string
  source: string
  type: string
  traceId?: string
  envelope: Record<string, unknown>
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

/** Best-effort POST mirror row to sync-service (does not throw on network errors). */
export async function postSyncMirrorEvent(
  baseUrl: string,
  row: {
    workspaceId: string
    sessionId?: string
    envelope: Record<string, unknown>
  },
  source: string,
): Promise<void> {
  const root = normalizeBase(baseUrl)
  await fetch(`${root}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: row.workspaceId,
      sessionId: row.sessionId,
      source,
      envelope: row.envelope,
    }),
  })
}

export async function fetchSyncHistory(
  baseUrl: string,
  workspaceId: string,
  opts?: { sinceSeq?: number; limit?: number },
): Promise<StoredEventRow[]> {
  const root = normalizeBase(baseUrl)
  const u = new URL(`${root}/v1/events`)
  u.searchParams.set('workspaceId', workspaceId)
  u.searchParams.set('sinceSeq', String(opts?.sinceSeq ?? 0))
  u.searchParams.set('limit', String(opts?.limit ?? 200))
  const res = await fetch(u.toString())
  if (!res.ok) {
    throw new Error(`GET /v1/events failed: ${res.status}`)
  }
  const j: unknown = await res.json()
  if (!j || typeof j !== 'object') return []
  const items = (j as { items?: unknown }).items
  if (!Array.isArray(items)) return []
  return items as StoredEventRow[]
}

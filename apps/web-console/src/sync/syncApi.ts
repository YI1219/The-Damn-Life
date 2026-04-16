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

const MIRROR_POST_RETRIES = 2
const MIRROR_RETRY_DELAY_MS = 100

/**
 * POST mirror row to sync-service. Retries transient failures a few times, then throws
 * (caller may surface health UI; relay path must not depend on this).
 */
export async function postSyncMirrorEvent(
  baseUrl: string,
  row: {
    workspaceId: string
    sessionId?: string
    envelope: Record<string, unknown>
  },
  source: string,
  opts?: { retries?: number; retryDelayMs?: number },
): Promise<void> {
  const retries = opts?.retries ?? MIRROR_POST_RETRIES
  const retryDelayMs = opts?.retryDelayMs ?? MIRROR_RETRY_DELAY_MS
  const root = normalizeBase(baseUrl)
  const url = `${root}/v1/events`
  const body = JSON.stringify({
    workspaceId: row.workspaceId,
    sessionId: row.sessionId,
    source,
    envelope: row.envelope,
  })

  let lastErr: Error | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) {
        throw new Error(`POST /v1/events failed: ${res.status}`)
      }
      return
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
      if (attempt < retries) {
        await new Promise((r) =>
          setTimeout(r, retryDelayMs * (attempt + 1)),
        )
      }
    }
  }
  throw lastErr
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

import type { WsMessage } from '@the-damn-life/event-contracts'

/** Dev default per `services/sync-service` README (`SYNC_PORT` 9797). */
export const DEFAULT_SYNC_BASE_URL = 'http://127.0.0.1:9797'

export type SyncMirrorConfig = {
  enabled: boolean
  baseUrl: string
}

const MIRROR_POST_RETRIES = 2
const MIRROR_RETRY_DELAY_MS = 100

export function normalizeSyncBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

export function shouldMirrorWireType(type: string): boolean {
  if (type === 'session.join' || type === 'session.joined') return true
  if (type.startsWith('task.')) return true
  if (type === 'audit.record') return true
  return false
}

export type SyncMirrorTransportHealth = {
  lastOkAt: string | null
  lastError: string | null
}

async function postMirrorWithRetry(
  base: string,
  body: unknown,
  opts?: { retries?: number; retryDelayMs?: number },
): Promise<void> {
  const retries = opts?.retries ?? MIRROR_POST_RETRIES
  const retryDelayMs = opts?.retryDelayMs ?? MIRROR_RETRY_DELAY_MS
  const url = `${base}/v1/events`
  const payload = JSON.stringify(body)

  let lastErr: Error | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
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

/**
 * Best-effort POST to sync-service; uses a small retry budget and never throws to the caller
 * (failures are surfaced via `hooks.onHealth` when provided; 主链路不受影响).
 */
export function mirrorWireEnvelopeBestEffort(
  cfg: SyncMirrorConfig,
  envelope: WsMessage,
  meta: { sessionId?: string },
  hooks?: {
    onHealth?: (h: SyncMirrorTransportHealth) => void
  },
): void {
  if (!cfg.enabled) return
  const base = normalizeSyncBaseUrl(cfg.baseUrl)
  if (!base) return
  const t = envelope.type
  if (!shouldMirrorWireType(t)) return

  const workspaceId =
    typeof envelope.workspaceId === 'string' && envelope.workspaceId.trim()
      ? envelope.workspaceId.trim()
      : 'default'

  const body = {
    workspaceId,
    sessionId: meta.sessionId,
    source: 'app-shell',
    envelope: envelope as unknown as Record<string, unknown>,
  }

  void postMirrorWithRetry(base, body)
    .then(() => {
      hooks?.onHealth?.({
        lastOkAt: new Date().toISOString(),
        lastError: null,
      })
    })
    .catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e)
      hooks?.onHealth?.({
        lastOkAt: null,
        lastError: msg,
      })
    })
}

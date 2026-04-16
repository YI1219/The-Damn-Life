import type { WsMessage } from '@the-damn-life/event-contracts'

/** Dev default per `services/sync-service` README (`SYNC_PORT` 9797). */
export const DEFAULT_SYNC_BASE_URL = 'http://127.0.0.1:9797'

export type SyncMirrorConfig = {
  enabled: boolean
  baseUrl: string
}

export function normalizeSyncBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

export function shouldMirrorWireType(type: string): boolean {
  if (type === 'session.join' || type === 'session.joined') return true
  if (type.startsWith('task.')) return true
  if (type === 'audit.record') return true
  return false
}

/**
 * Best-effort POST to sync-service; never throws; failures are ignored (主链路不受影响).
 */
export function mirrorWireEnvelopeBestEffort(
  cfg: SyncMirrorConfig,
  envelope: WsMessage,
  meta: { sessionId?: string },
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

  void fetch(`${base}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {
    /* best-effort */
  })
}

import { useCallback, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { WsMessage } from '@the-damn-life/event-contracts'
import {
  DEFAULT_SYNC_BASE_URL,
  RelayHostSession,
  appendHostAuditLine,
  createConfirmPermissionPolicy,
  forwardEnvelopeToRuntime,
  getOrCreateHostId,
  mirrorWireEnvelopeBestEffort,
  type RelayHostSessionHandlers,
  type SyncMirrorConfig,
} from '../../../src/bridge/index.js'

export type SyncHealth = { lastOkAt: string | null; lastError: string | null }

export interface UseRelaySessionOptions {
  confirm: (title: string, message: string) => Promise<boolean>
}

// ─── Module-level helpers (pure, no React hooks) ──────────────────────────────

type ConfirmFn = (title: string, message: string) => Promise<boolean>
type LogFn = (line: string) => void

async function confirmRelayOutbound(
  relayUrl: string,
  confirm: ConfirmFn,
  log: LogFn,
): Promise<boolean> {
  if (!(await confirm('允许 WebSocket 出站连接？', `目标：\n${relayUrl}`))) {
    void appendHostAuditLine({
      action: 'relay.connect.denied_by_user',
      outcome: 'denied',
      resource: relayUrl,
      actor: { kind: 'system', subject: 'app-shell' },
    })
    log('connect cancelled by user')
    return false
  }
  return true
}

async function confirmRuntimeBridge(
  bridgeUrl: string,
  confirm: ConfirmFn,
  log: LogFn,
): Promise<string | null> {
  if (!bridgeUrl) return null
  if (
    !(await confirm(
      '允许 Runtime HTTP 出站转发？',
      `将会请求：POST ${bridgeUrl.replace(/\/$/, '')}/handle\n\n说明：仅对 task.submit 生效，用于本地把任务交给 runtime-py bridge_http 执行并回流事件。`,
    ))
  ) {
    void appendHostAuditLine({
      action: 'runtime.http.denied_by_user',
      outcome: 'denied',
      resource: bridgeUrl,
      actor: { kind: 'system', subject: 'app-shell' },
    })
    log('runtime bridge outbound declined — Relay 仍会连接，但不会向 Runtime 转发 task')
    return null
  }
  void appendHostAuditLine({
    action: 'runtime.http.consented',
    outcome: 'success',
    resource: bridgeUrl,
    actor: { kind: 'system', subject: 'app-shell' },
  })
  return bridgeUrl
}

async function confirmSyncMirror(opts: {
  syncBase: string
  enabled: boolean
  confirm: ConfirmFn
  log: LogFn
  onCancelled: (() => void) | undefined
}): Promise<boolean> {
  if (!opts.enabled) return false
  if (
    !(await opts.confirm(
      '允许向 sync-service 镜像关键事件？',
      `将把 task.* / audit.record / session.join* 等信封 best-effort POST 到：\n${opts.syncBase.replace(/\/$/, '')}/v1/events\n\n字段：workspaceId（信封或 default）、sessionId（信封）、source=app-shell。\n失败不影响 Relay / Runtime 主链路。`,
    ))
  ) {
    opts.onCancelled?.()
    opts.log('sync mirror cancelled by user')
    return false
  }
  return true
}

function buildRuntimeWireHandler(
  allowedRuntimeBase: string | null,
  syncMirrorCfg: SyncMirrorConfig,
  log: LogFn,
  setSyncHealth: (h: SyncHealth) => void,
  sessionRef: MutableRefObject<RelayHostSession | null>,
): NonNullable<RelayHostSessionHandlers['onRuntimeWire']> {
  return async (m) => {
    log(`→ runtime wire: ${m.type}`)
    if (!allowedRuntimeBase || m.type !== 'task.submit') return
    try {
      const outs = await forwardEnvelopeToRuntime(allowedRuntimeBase, m)
      for (const out of outs) {
        mirrorWireEnvelopeBestEffort(
          syncMirrorCfg,
          out,
          { sessionId: out.sessionId ?? sessionRef.current?.activeSessionId },
          { onHealth: (h: SyncHealth) => setSyncHealth(h) },
        )
        sessionRef.current?.sendToRelay(out)
      }
    } catch (e) {
      log(`runtime bridge failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRelaySession({ confirm }: UseRelaySessionOptions) {
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [syncHealth, setSyncHealth] = useState<SyncHealth>({ lastOkAt: null, lastError: null })
  const sessionRef = useRef<RelayHostSession | null>(null)
  const hostId = useRef(getOrCreateHostId()).current

  const log = useCallback((line: string) => {
    setLogs((prev) => [...prev, line])
  }, [])

  const connect = useCallback(
    async (opts: {
      relayUrl: string
      roleKey: string
      runtimeBridgeUrl: string
      syncMirrorEnabled: boolean
      syncBaseUrl: string
      onSyncMirrorCancelled?: () => void
    }) => {
      const { relayUrl, runtimeBridgeUrl, syncMirrorEnabled, syncBaseUrl, onSyncMirrorCancelled } =
        opts

      if (!relayUrl) {
        log('error: empty URL')
        return
      }

      if (!(await confirmRelayOutbound(relayUrl, confirm, log))) return

      const allowedRuntimeBase = await confirmRuntimeBridge(runtimeBridgeUrl, confirm, log)

      const syncBase = syncBaseUrl || DEFAULT_SYNC_BASE_URL
      const finalSyncEnabled = await confirmSyncMirror({
        syncBase,
        enabled: syncMirrorEnabled,
        confirm,
        log,
        onCancelled: onSyncMirrorCancelled,
      })

      const syncMirrorCfg: SyncMirrorConfig = { enabled: finalSyncEnabled, baseUrl: syncBase }
      setSyncHealth({ lastOkAt: null, lastError: null })

      const permissionPolicy = createConfirmPermissionPolicy((prompt: string) =>
        confirm('权限请求', prompt),
      )

      sessionRef.current?.disconnect()

      const session = new RelayHostSession(permissionPolicy, {
        mirrorEnvelope: (m: WsMessage) =>
          mirrorWireEnvelopeBestEffort(
            syncMirrorCfg,
            m,
            { sessionId: m.sessionId ?? session.activeSessionId },
            { onHealth: (h: SyncHealth) => setSyncHealth(h) },
          ),
        onSessionJoined: (sid, ws) =>
          log(`session.joined: sessionId=${sid ?? '(none)'} workspaceId=${ws ?? '(none)'}`),
        onPermissionResolved: (p) => log(`permission.resolved: ${p.permissionId} → ${p.decision}`),
        onRuntimeWire: buildRuntimeWireHandler(
          allowedRuntimeBase,
          syncMirrorCfg,
          log,
          setSyncHealth,
          sessionRef,
        ),
        onError: (e) => log(`error: ${e}`),
      })

      sessionRef.current = session

      try {
        await session.connect(relayUrl, { capabilities: `hostId=${hostId}` })
        setConnected(true)
        log(`connected: ${relayUrl}`)
      } catch (e: unknown) {
        log(`connect failed: ${e instanceof Error ? e.message : String(e)}`)
        setConnected(false)
      }
    },
    [confirm, hostId, log],
  )

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect()
    sessionRef.current = null
    setConnected(false)
    setSyncHealth({ lastOkAt: null, lastError: null })
    log('disconnected')
  }, [log])

  return { connected, logs, syncHealth, hostId, connect, disconnect }
}

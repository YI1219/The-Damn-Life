import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { buildRelayHostWsUrl, DEFAULT_SYNC_BASE_URL } from '../../../src/bridge/index.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useRelaySession, type SyncHealth } from '../hooks/useRelaySession.js'

interface HostPanelProps {
  confirm: (title: string, message: string) => Promise<boolean>
}

function SyncMirrorHealth({
  enabled,
  health,
}: {
  enabled: boolean
  health: SyncHealth
}): ReactNode {
  if (!enabled) return null
  if (health.lastError) {
    return (
      <p className="hint danger">
        <strong>Mirror gap:</strong> {health.lastError}（Relay / Runtime 主链路不受影响）
      </p>
    )
  }
  if (health.lastOkAt) {
    return (
      <p className="hint">
        Last mirror POST ok: <code>{health.lastOkAt}</code>
      </p>
    )
  }
  return (
    <p className="hint">No mirror POST yet — connect and emit task/audit/session wire first.</p>
  )
}

export function HostPanel({ confirm }: HostPanelProps): ReactNode {
  const [roleKey, setRoleKey] = useLocalStorage('tdl:relayRoleKey', '')
  const [runtimeBridgeUrl, setRuntimeBridgeUrl] = useLocalStorage(
    'tdl:runtimeBridgeUrl',
    'http://127.0.0.1:9876',
  )
  const [syncMirrorEnabled, setSyncMirrorEnabledRaw] = useLocalStorage('tdl:syncMirrorEnabled', '0')
  const [syncBaseUrl, setSyncBaseUrl] = useLocalStorage('tdl:syncBaseUrl', DEFAULT_SYNC_BASE_URL)

  // relay URL: derived from roleKey but user-editable (roleKey change overwrites it)
  const [relayUrl, setRelayUrl] = useState(() => buildRelayHostWsUrl({ roleKey }))

  const { connected, logs, syncHealth, hostId, connect, disconnect } = useRelaySession({ confirm })

  const logRef = useRef<HTMLPreElement>(null)
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const handleConnect = useCallback(() => {
    void connect({
      relayUrl,
      roleKey,
      runtimeBridgeUrl,
      syncMirrorEnabled: syncMirrorEnabled === '1',
      syncBaseUrl,
      onSyncMirrorCancelled: () => setSyncMirrorEnabledRaw('0'),
    })
  }, [
    connect,
    relayUrl,
    roleKey,
    runtimeBridgeUrl,
    syncMirrorEnabled,
    syncBaseUrl,
    setSyncMirrorEnabledRaw,
  ])

  return (
    <div className="host-panel">
      <h1>The Damn Life — Host</h1>
      <p className="hint">
        Host id: <code>{hostId}</code>
      </p>
      <p className="hint">
        Relay 与 Runtime HTTP（填写基址时）均需你显式确认出站；权限请求不会静默放行。
      </p>

      <label>
        Role key (optional; enables multi-pair within one session)
        <input
          type="text"
          size={24}
          autoComplete="off"
          placeholder="(empty = default)"
          value={roleKey}
          onChange={(e) => {
            const next = e.target.value
            setRoleKey(next)
            setRelayUrl(buildRelayHostWsUrl({ roleKey: next }))
          }}
        />
      </label>

      <label>
        Relay WebSocket URL
        <input
          type="text"
          size={72}
          autoComplete="off"
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
        />
      </label>

      <label>
        Runtime bridge (runtime-py HTTP, optional)
        <input
          type="text"
          size={72}
          autoComplete="off"
          placeholder="http://127.0.0.1:9876"
          value={runtimeBridgeUrl}
          onChange={(e) => setRuntimeBridgeUrl(e.target.value)}
        />
      </label>

      <label className="inline-check">
        <input
          type="checkbox"
          checked={syncMirrorEnabled === '1'}
          onChange={(e) => setSyncMirrorEnabledRaw(e.target.checked ? '1' : '0')}
        />
        启用 sync-service 事件镜像（默认关闭；失败不影响主链路）
      </label>

      <label>
        Sync base URL（默认端口 9797）
        <input
          type="text"
          size={72}
          autoComplete="off"
          placeholder="http://127.0.0.1:9797"
          value={syncBaseUrl}
          onChange={(e) => setSyncBaseUrl(e.target.value)}
        />
      </label>

      <SyncMirrorHealth enabled={syncMirrorEnabled === '1'} health={syncHealth} />

      <div className="row">
        <button type="button" disabled={connected} onClick={handleConnect}>
          连接 Relay
        </button>
        <button type="button" className="danger" disabled={!connected} onClick={disconnect}>
          断开
        </button>
      </div>

      <pre className="log" ref={logRef}>
        {logs.join('\n')}
      </pre>
    </div>
  )
}

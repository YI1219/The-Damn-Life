import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRelaySession } from './hooks/useRelaySession'
import {
  fetchSyncHistory,
  type StoredEventRow,
} from './sync/syncApi'
import { identityHintsFromEnvelope } from './sync/streamIdentity'
import { buildRelayRemoteUrl, splitRelayRemoteUrl } from './wire/relayUrl'

const STORAGE_BASE = 'tdl:relayWsBase'
const STORAGE_SESSION = 'tdl:relaySessionKey'
const STORAGE_WS = 'tdl:workspaceId'
const STORAGE_ROLE_KEY = 'tdl:relayRoleKey'
const STORAGE_SYNC_BASE = 'tdl:syncServiceBase'
const STORAGE_SYNC_MIRROR = 'tdl:syncMirrorEnabled'

const defaultRelayBase =
  import.meta.env.VITE_RELAY_WS_BASE ?? 'ws://127.0.0.1:8765/ws'
const defaultSessionKey = 'demo'
const defaultSyncBase =
  import.meta.env.VITE_SYNC_BASE ?? 'http://127.0.0.1:9797'

function phaseLabel(phase: string) {
  switch (phase) {
    case 'idle':
      return 'Disconnected'
    case 'connecting':
      return 'Connecting…'
    case 'handshake':
      return 'Joining session…'
    case 'ready':
      return 'Session active'
    case 'closed':
      return 'Disconnected'
    default:
      return phase
  }
}

export function App() {
  const [syncBase, setSyncBase] = useState(() => {
    if (typeof window === 'undefined') return defaultSyncBase
    return localStorage.getItem(STORAGE_SYNC_BASE) ?? defaultSyncBase
  })

  const [syncMirrorEnabled, setSyncMirrorEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_SYNC_MIRROR) === '1'
  })

  const [historyRows, setHistoryRows] = useState<StoredEventRow[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const [relayBase, setRelayBase] = useState(() => {
    if (typeof window === 'undefined') return defaultRelayBase
    try {
      const q = new URLSearchParams(window.location.search)
      const fromQuery = q.get('relay')
      if (fromQuery) {
        const split = splitRelayRemoteUrl(fromQuery)
        if (split) return split.base
      }
    } catch {
      /* ignore */
    }
    return localStorage.getItem(STORAGE_BASE) ?? defaultRelayBase
  })

  const [sessionKey, setSessionKey] = useState(() => {
    if (typeof window === 'undefined') return defaultSessionKey
    try {
      const q = new URLSearchParams(window.location.search)
      const fromRelay = q.get('relay')
      if (fromRelay) {
        const split = splitRelayRemoteUrl(fromRelay)
        if (split) return split.session
      }
      const onlySession = q.get('session')
      if (onlySession) return onlySession
    } catch {
      /* ignore */
    }
    return localStorage.getItem(STORAGE_SESSION) ?? defaultSessionKey
  })

  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const q = new URLSearchParams(window.location.search)
      const fromQuery = q.get('workspace')
      if (fromQuery) return fromQuery
    } catch {
      /* ignore */
    }
    return localStorage.getItem(STORAGE_WS) ?? ''
  })

  const [roleKey, setRoleKey] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const q = new URLSearchParams(window.location.search)
      const fromRelay = q.get('relay')
      if (fromRelay) {
        const split = splitRelayRemoteUrl(fromRelay)
        if (split) return split.roleKey
      }
      const fromQuery = q.get('roleKey')
      if (fromQuery) return fromQuery
    } catch {
      /* ignore */
    }
    return localStorage.getItem(STORAGE_ROLE_KEY) ?? ''
  })

  const [intent, setIntent] = useState('')

  const syncMirrorConfig = useMemo(() => {
    if (!syncMirrorEnabled || !syncBase.trim()) return undefined
    return {
      baseUrl: syncBase.trim(),
      enabled: true as const,
      getFormWorkspaceId: () => workspaceId,
    }
  }, [syncBase, syncMirrorEnabled, workspaceId])

  const {
    phase,
    lastError,
    tasks,
    activity,
    activeWorkspaceId,
    connect,
    disconnect,
    submitTask,
  } = useRelaySession(syncMirrorConfig)

  const effectiveWorkspaceForSync = useMemo(() => {
    const fromJoin = activeWorkspaceId?.trim()
    const fromField = workspaceId.trim()
    return fromJoin || fromField || ''
  }, [activeWorkspaceId, workspaceId])

  const refreshHistory = useCallback(async () => {
    const wid = effectiveWorkspaceForSync
    const base = syncBase.trim()
    if (!wid || !base) {
      setHistoryError('Workspace id and sync base URL are required.')
      return
    }
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const items = await fetchSyncHistory(base, wid)
      setHistoryRows(items)
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : String(e))
    } finally {
      setHistoryLoading(false)
    }
  }, [effectiveWorkspaceForSync, syncBase])

  useEffect(() => {
    if (phase === 'ready' && effectiveWorkspaceForSync && syncBase.trim()) {
      void refreshHistory()
    }
  }, [effectiveWorkspaceForSync, phase, refreshHistory, syncBase])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BASE, relayBase)
    } catch {
      /* ignore */
    }
  }, [relayBase])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSION, sessionKey)
    } catch {
      /* ignore */
    }
  }, [sessionKey])

  useEffect(() => {
    try {
      if (workspaceId) localStorage.setItem(STORAGE_WS, workspaceId)
      else localStorage.removeItem(STORAGE_WS)
    } catch {
      /* ignore */
    }
  }, [workspaceId])

  useEffect(() => {
    try {
      if (roleKey) localStorage.setItem(STORAGE_ROLE_KEY, roleKey)
      else localStorage.removeItem(STORAGE_ROLE_KEY)
    } catch {
      /* ignore */
    }
  }, [roleKey])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SYNC_BASE, syncBase)
    } catch {
      /* ignore */
    }
  }, [syncBase])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SYNC_MIRROR, syncMirrorEnabled ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [syncMirrorEnabled])

  const taskList = useMemo(
    () =>
      Object.values(tasks).sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true }),
      ),
    [tasks],
  )

  const workspaceStream = useMemo(() => {
    type Row = {
      key: string
      at: string
      lane: 'live' | 'mirror'
      badge: string
      title: string
      body?: string
      source?: string
      hostId?: string
      clientRole?: string
    }
    const live: Row[] = activity.map((a) => ({
      key: `live-${a.id}`,
      at: a.at,
      lane: 'live',
      badge: a.kind,
      title: a.summary,
      body: a.payloadPreview,
      source: 'web-console',
      ...(a.hostId ? { hostId: a.hostId } : {}),
      ...(a.clientRole ? { clientRole: a.clientRole } : {}),
    }))
    const mirror: Row[] = historyRows.map((r) => {
      const hints = identityHintsFromEnvelope(r.envelope)
      return {
        key: `mirror-${r.seq}-${r.receivedAt}`,
        at: r.receivedAt,
        lane: 'mirror' as const,
        badge: 'mirror',
        title: r.type,
        body: JSON.stringify(
          {
            seq: r.seq,
            traceId: r.traceId,
            sessionId: r.sessionId,
            payload: (r.envelope as { payload?: unknown }).payload,
          },
          null,
          0,
        ).slice(0, 1800),
        source: r.source,
        ...(hints.hostId ? { hostId: hints.hostId } : {}),
        ...(hints.clientRole ? { clientRole: hints.clientRole } : {}),
      }
    })
    return [...live, ...mirror].sort((a, b) =>
      a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
    )
  }, [activity, historyRows])

  const canSubmit = phase === 'ready' && intent.trim().length > 0

  const composedWsUrl = useMemo(
    () => buildRelayRemoteUrl(relayBase.trim(), sessionKey.trim(), roleKey.trim()),
    [relayBase, roleKey, sessionKey],
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'var(--surface)',
        }}
      >
        <div>
          <strong>Remote console</strong>
          <span style={{ color: 'var(--muted)', marginLeft: '0.75rem' }}>
            Task-first · workspace collaboration on the right
          </span>
        </div>
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            textAlign: 'right',
          }}
        >
          Relay WebSocket · contract-driven events
          {phase === 'ready' && activeWorkspaceId ? (
            <div style={{ fontSize: '0.8rem' }}>
              Workspace: <code>{activeWorkspaceId}</code>
            </div>
          ) : null}
        </div>
      </header>

      <div className="console-ia-rail">
        <span>
          <strong>Flow</strong>: pair relay → run tasks (center) → read the{' '}
          <strong>workspace story</strong> (stream + mirror); still no device
          table.
        </span>
        <nav aria-label="In-page sections">
          <a href="#tdl-session">Session</a>
          <a href="#tdl-tasks">Tasks</a>
          <a href="#tdl-workspace-stream">Stream</a>
          <a href="#tdl-mirror-history">Mirror</a>
        </nav>
      </div>

      <main className="console-main" style={{ flex: 1 }}>
        <section
          id="tdl-session"
          aria-labelledby="tdl-session-title"
          style={{
            background: 'var(--bg)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Transport · pair with host
          </div>
          <h2 id="tdl-session-title" style={{ margin: 0, fontSize: '1rem' }}>
            Session
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
            On connect we open{' '}
            <code>{'?session=<id>&role=remote'}</code> — use the same{' '}
            <code>session</code> id as the host peer. Task-first UI; no device
            table.
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Relay WebSocket path
            </span>
            <input
              value={relayBase}
              onChange={(e) => setRelayBase(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={defaultRelayBase}
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Session id (pair with host)
            </span>
            <input
              value={sessionKey}
              onChange={(e) => setSessionKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={defaultSessionKey}
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Role key (optional; enables multi-pair within one session)
            </span>
            <input
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="(empty = default)"
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            />
          </label>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--muted)',
              wordBreak: 'break-all',
            }}
          >
            Connects to: <code>{composedWsUrl}</code>
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Workspace id (optional)
            </span>
            <input
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="default / single-workspace MVP"
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            />
          </label>
          <div
            style={{
              padding: '0.6rem',
              borderRadius: 6,
              border: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <strong>Sync mirror (optional)</strong>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
              Best-effort <code>POST /v1/events</code> to sync-service (default{' '}
              <code>:9797</code>). Requires a non-empty workspace id (form or
              joined). Does not affect Relay.
            </span>
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Sync service base URL
              </span>
              <input
                value={syncBase}
                onChange={(e) => setSyncBase(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={defaultSyncBase}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={syncMirrorEnabled}
                onChange={(e) => setSyncMirrorEnabled(e.target.checked)}
              />
              <span>Mirror inbound/outbound wire to sync-service</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() =>
                connect(composedWsUrl, workspaceId.trim() || undefined)
              }
              disabled={phase === 'connecting' || phase === 'handshake'}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 6,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              Connect
            </button>
            <button
              type="button"
              onClick={() => disconnect()}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              Disconnect
            </button>
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.6rem',
              borderRadius: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
            }}
          >
            <div>
              Status:{' '}
              <strong
                style={{
                  color:
                    phase === 'ready'
                      ? 'var(--ok)'
                      : phase === 'connecting' || phase === 'handshake'
                        ? 'var(--accent)'
                        : 'var(--muted)',
                }}
              >
                {phaseLabel(phase)}
              </strong>
            </div>
            {lastError ? (
              <div style={{ color: 'var(--danger)', marginTop: '0.35rem' }}>
                {lastError}
              </div>
            ) : null}
          </div>
        </section>

        <section
          id="tdl-tasks"
          aria-labelledby="tdl-tasks-title"
          style={{
            background: 'var(--bg)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Primary · your work
          </div>
          <h2 id="tdl-tasks-title" style={{ margin: 0, fontSize: '1rem' }}>
            Tasks
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!canSubmit) return
              submitTask(intent, workspaceId.trim() || undefined)
              setIntent('')
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Intent (task.submit)
              </span>
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                rows={3}
                placeholder="Describe what the runtime should do…"
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  resize: 'vertical',
                }}
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                alignSelf: 'flex-start',
                padding: '0.45rem 0.9rem',
                borderRadius: 6,
                border: 'none',
                background: canSubmit ? 'var(--accent)' : 'var(--border)',
                color: '#fff',
              }}
            >
              Submit task
            </button>
          </form>

          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {taskList.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                No tasks yet. After connect, submissions appear here with
                runtime progress.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {taskList.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{t.id}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {t.phase}
                      {typeof t.percent === 'number'
                        ? ` · ${t.percent}%`
                        : ''}
                      {t.workspaceId ? (
                        <>
                          {' '}
                          · <code>{t.workspaceId}</code>
                        </>
                      ) : null}
                    </div>
                    {t.intent ? (
                      <div style={{ marginTop: '0.35rem' }}>{t.intent}</div>
                    ) : null}
                    {t.detail ? (
                      <div
                        style={{
                          marginTop: '0.35rem',
                          color: 'var(--muted)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {t.detail}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          id="tdl-workspace-stream"
          aria-labelledby="tdl-workspace-stream-title"
          style={{
            background: 'var(--bg)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Collaboration · shared timeline
          </div>
          <h2
            id="tdl-workspace-stream-title"
            style={{ margin: 0, fontSize: '1rem' }}
          >
            Workspace stream
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
            Merges <strong>live</strong> events from this console with{' '}
            <strong>mirror</strong> rows from sync-service (multi-writer). Task /
            audit first; not a device table.
          </p>
          {roleKey.trim() ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
              Relay <strong>pair</strong> for this tab: <code>{roleKey.trim()}</code>{' '}
              (URL path key; not stored in mirror envelopes).
            </p>
          ) : null}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {workspaceStream.length === 0 ? (
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Connect, then events and mirrored history appear here.
              </span>
            ) : (
              workspaceStream.map((row) => (
                <div
                  key={row.key}
                  style={{
                    padding: '0.5rem 0.6rem',
                    borderRadius: 6,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ color: 'var(--muted)' }}>{row.at}</div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        color:
                          row.lane === 'live' ? 'var(--accent)' : 'var(--ok)',
                        marginRight: '0.35rem',
                      }}
                    >
                      {row.lane}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        marginRight: '0.35rem',
                      }}
                    >
                      {row.badge}
                    </span>
                    <strong>{row.title}</strong>
                    {row.source ? (
                      <span style={{ color: 'var(--muted)', marginLeft: '0.35rem' }}>
                        · {row.source}
                      </span>
                    ) : null}
                  </div>
                  {row.hostId || row.clientRole ? (
                    <div
                      style={{
                        marginTop: '0.2rem',
                        fontSize: '0.72rem',
                        color: 'var(--muted)',
                        lineHeight: 1.35,
                      }}
                    >
                      {row.hostId ? (
                        <>
                          host <code>{row.hostId}</code>
                        </>
                      ) : null}
                      {row.clientRole ? (
                        <>
                          {row.hostId ? ' · ' : null}
                          peer <code>{row.clientRole}</code>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {row.body ? (
                    <pre
                      style={{
                        margin: '0.35rem 0 0',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'var(--muted)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {row.body}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section
          id="tdl-mirror-history"
          aria-labelledby="tdl-mirror-history-title"
          style={{
            background: 'var(--bg)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Diagnostics · raw mirror
          </div>
          <h2
            id="tdl-mirror-history-title"
            style={{ margin: 0, fontSize: '1rem' }}
          >
            History (read-only)
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
            <code>GET /v1/events?workspaceId=…</code> — same{' '}
            <strong>workspaceId</strong> filter as mirror writes (joined id wins,
            else Session field). For catch-up after reconnect; not a device list.
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Query workspace:{' '}
            <code>{effectiveWorkspaceForSync || '(set workspace id)'}</code>
          </div>
          <button
            type="button"
            onClick={() => void refreshHistory()}
            disabled={historyLoading || !effectiveWorkspaceForSync}
            style={{
              alignSelf: 'flex-start',
              padding: '0.45rem 0.9rem',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            {historyLoading ? 'Loading…' : 'Refresh history'}
          </button>
          {historyError ? (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
              {historyError}
            </div>
          ) : null}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            {historyRows.length === 0 ? (
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {phase === 'ready' && effectiveWorkspaceForSync
                  ? 'No mirrored rows yet (Host may be the only writer).'
                  : 'Connect with a workspace id to load history.'}
              </span>
            ) : (
              historyRows.map((r) => (
                <div
                  key={`${r.seq}-${r.receivedAt}`}
                  style={{
                    padding: '0.45rem 0.55rem',
                    borderRadius: 6,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ color: 'var(--muted)' }}>
                    #{r.seq} · {r.receivedAt} ·{' '}
                    <span style={{ color: 'var(--accent)' }}>{r.source}</span>
                  </div>
                  <div>
                    <strong>{r.type}</strong>
                    {r.traceId ? (
                      <>
                        {' '}
                        · <code>{r.traceId}</code>
                      </>
                    ) : null}
                    {r.sessionId ? (
                      <>
                        {' '}
                        · session <code>{r.sessionId}</code>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

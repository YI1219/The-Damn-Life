import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionId, WorkspaceId } from '@the-damn-life/event-contracts'
import { postSyncMirrorEvent } from '../sync/syncApi'
import { joinRemoteEnvelope, newTraceId, taskSubmitEnvelope } from '../wire/envelope'
import { parseIncoming } from '../wire/parseIncoming'

/** Optional best-effort mirror to `services/sync-service` (POST /v1/events). */
export type RelaySyncMirrorInput = {
  baseUrl: string
  enabled: boolean
  /** Session panel workspace field — `session.joined` workspace wins when set. */
  getFormWorkspaceId: () => string
}

export type RelayConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'handshake'
  | 'ready'
  | 'closed'

export type TaskRow = {
  id: string
  phase: 'submitted' | 'accepted' | 'running' | 'completed' | 'failed'
  clientTaskRef?: string
  intent?: string
  detail?: string
  percent?: number
  workspaceId?: string
}

export type ActivityItem = {
  id: string
  at: string
  kind: 'event' | 'system'
  summary: string
  payloadPreview?: string
  workspaceId?: string
}

function extractHostIdFromCapabilities(
  capabilities: unknown,
): string | undefined {
  if (typeof capabilities !== 'string') return undefined
  // app-shell sets `capabilities: hostId=<uuid>`
  const m = capabilities.match(/\bhostId=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i)
  return m?.[1]
}

function readPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const p = raw.payload
  if (p && typeof p === 'object') return p as Record<string, unknown>
  return {}
}

export function useRelaySession(syncMirror?: RelaySyncMirrorInput) {
  const wsRef = useRef<WebSocket | null>(null)
  const boundSessionRef = useRef<SessionId | null>(null)
  const syncMirrorRef = useRef(syncMirror)
  useEffect(() => {
    syncMirrorRef.current = syncMirror
  }, [syncMirror])

  const [phase, setPhase] = useState<RelayConnectionPhase>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Record<string, TaskRow>>({})
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId | null>(
    null,
  )

  const pushActivity = useCallback((item: Omit<ActivityItem, 'id' | 'at'>) => {
    const id = crypto.randomUUID()
    const at = new Date().toISOString()
    setActivity((prev) => [{ id, at, ...item }, ...prev].slice(0, 200))
  }, [])

  const mirrorWire = useCallback(
    (envelope: Record<string, unknown>) => {
      const m = syncMirrorRef.current
      if (!m?.enabled) return
      const base = m.baseUrl.trim()
      if (!base) return
      const wid =
        (activeWorkspaceId?.trim() || m.getFormWorkspaceId()?.trim()) ||
        undefined
      if (!wid) return
      const sessionId =
        typeof envelope.sessionId === 'string'
          ? envelope.sessionId
          : boundSessionRef.current ?? undefined
      void postSyncMirrorEvent(
        base,
        { workspaceId: wid, sessionId, envelope },
        'web-console',
      ).catch(() => {
        /* best-effort; relay path does not depend on mirror */
      })
    },
    [activeWorkspaceId],
  )

  const applyEvent = useCallback(
    (parsed: NonNullable<ReturnType<typeof parseIncoming>>) => {
      const { type, raw } = parsed
      const payload = readPayload(raw)
      const wsFromEnvelope =
        typeof raw.workspaceId === 'string' ? raw.workspaceId : undefined

      if (type === 'session.joined') {
        const sidFromPayload =
          typeof payload.sessionId === 'string' ? payload.sessionId : null
        const sidFromEnvelope =
          typeof raw.sessionId === 'string' ? raw.sessionId : null
        const sid = sidFromPayload ?? sidFromEnvelope
        if (sid) {
          boundSessionRef.current = sid as SessionId
          const ws =
            typeof payload.workspaceId === 'string'
              ? (payload.workspaceId as WorkspaceId)
              : null
          setActiveWorkspaceId(ws)
          setPhase('ready')
          pushActivity({
            kind: 'event',
            summary: `Joined session ${sid}`,
            payloadPreview: JSON.stringify({
              sessionId: sid,
              workspaceId: ws ?? undefined,
            }),
          })
        }
        return
      }

      // Relay forwards peer `session.join` (payload-opaque) — use it for lightweight peer hints.
      if (type === 'session.join') {
        const clientRole =
          typeof payload.clientRole === 'string' ? payload.clientRole : undefined
        const hostId = extractHostIdFromCapabilities(payload.capabilities)
        const isHost = clientRole === 'host_runtime'
        const secondary = hostId !== undefined ? ` · hostId=${hostId}` : ''
        pushActivity({
          kind: 'event',
          summary: `${isHost ? 'Host' : 'Peer'} joined${secondary}`,
          payloadPreview: JSON.stringify({
            clientRole,
            ...(hostId ? { hostId } : {}),
          }),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'task.accepted') {
        const taskId = payload.taskId
        if (typeof taskId === 'string') {
          const ref =
            typeof payload.clientTaskRef === 'string'
              ? payload.clientTaskRef
              : undefined
          setTasks((prev) => {
            const next = { ...prev }
            if (ref && next[ref]) delete next[ref]
            next[taskId] = {
              id: taskId,
              phase: 'accepted',
              clientTaskRef: ref,
              detail: 'Accepted by runtime',
              workspaceId: wsFromEnvelope,
            }
            return next
          })
        }
        pushActivity({
          kind: 'event',
          summary: 'task.accepted',
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'task.started') {
        const taskId = payload.taskId
        if (typeof taskId === 'string') {
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'running' }),
              phase: 'running',
              detail: 'Running',
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: 'task.started',
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'task.progress') {
        const taskId = payload.taskId
        if (typeof taskId === 'string') {
          const percent =
            typeof payload.percent === 'number' ? payload.percent : undefined
          const message =
            typeof payload.message === 'string' ? payload.message : undefined
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'running' }),
              phase: 'running',
              percent,
              detail: message,
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: 'task.progress',
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'task.completed') {
        const taskId = payload.taskId
        if (typeof taskId === 'string') {
          const summary =
            typeof payload.resultSummary === 'string'
              ? payload.resultSummary
              : 'Completed'
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'completed' }),
              phase: 'completed',
              detail: summary,
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: 'task.completed',
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'task.failed') {
        const taskId = payload.taskId
        if (typeof taskId === 'string') {
          const message =
            typeof payload.message === 'string' ? payload.message : 'Failed'
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'failed' }),
              phase: 'failed',
              detail: message,
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: 'task.failed',
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'skill.invoked') {
        const taskId = payload.taskId
        const skillId =
          typeof payload.skillId === 'string' ? payload.skillId : '(skill)'
        if (typeof taskId === 'string') {
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'running' }),
              phase: 'running',
              detail: `Invoked ${skillId}`,
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: `skill.invoked (${skillId})`,
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'skill.completed') {
        const taskId = payload.taskId
        const skillId =
          typeof payload.skillId === 'string' ? payload.skillId : '(skill)'
        if (typeof taskId === 'string') {
          const ms =
            typeof payload.durationMs === 'number'
              ? ` (${payload.durationMs}ms)`
              : ''
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'running' }),
              phase: 'running',
              detail: `Skill ${skillId} completed${ms}`,
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: `skill.completed (${skillId})`,
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'skill.failed') {
        const taskId = payload.taskId
        const skillId =
          typeof payload.skillId === 'string' ? payload.skillId : '(skill)'
        const message =
          typeof payload.message === 'string' ? payload.message : 'Skill failed'
        if (typeof taskId === 'string') {
          setTasks((prev) => ({
            ...prev,
            [taskId]: {
              ...(prev[taskId] ?? { id: taskId, phase: 'failed' }),
              phase: 'failed',
              detail: `${skillId}: ${message}`,
              workspaceId: wsFromEnvelope ?? prev[taskId]?.workspaceId,
            },
          }))
        }
        pushActivity({
          kind: 'event',
          summary: `skill.failed (${skillId})`,
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'audit.record') {
        const action =
          typeof payload.action === 'string' ? payload.action : 'audit'
        pushActivity({
          kind: 'event',
          summary: `audit: ${action}`,
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'permission.requested' || type === 'permission.resolved') {
        pushActivity({
          kind: 'event',
          summary: type,
          payloadPreview: JSON.stringify(payload),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'system.error') {
        const code = typeof payload.code === 'string' ? payload.code : 'error'
        const message =
          typeof payload.message === 'string'
            ? payload.message
            : JSON.stringify(payload)
        setLastError(`${code}: ${message}`)
        pushActivity({
          kind: 'system',
          summary: `system.error ${code}`,
          payloadPreview: message,
          workspaceId: wsFromEnvelope,
        })
        return
      }

      if (type === 'unknown') {
        const t = typeof raw.type === 'string' ? raw.type : 'message'
        pushActivity({
          kind: 'system',
          summary: t,
          payloadPreview: JSON.stringify(raw).slice(0, 500),
          workspaceId: wsFromEnvelope,
        })
        return
      }

      pushActivity({
        kind: 'event',
        summary: type,
        payloadPreview: JSON.stringify(payload),
        workspaceId: wsFromEnvelope,
      })
    },
    [pushActivity],
  )

  const disconnect = useCallback(() => {
    boundSessionRef.current = null
    setActiveWorkspaceId(null)
    const w = wsRef.current
    wsRef.current = null
    if (w && w.readyState === WebSocket.OPEN) w.close()
    if (w && w.readyState === WebSocket.CONNECTING) w.close()
    setPhase('closed')
  }, [])

  const connect = useCallback(
    (wsUrl: string, workspaceId?: WorkspaceId) => {
      disconnect()
      setLastError(null)
      setPhase('connecting')
      boundSessionRef.current = null

      let socket: WebSocket
      try {
        socket = new WebSocket(wsUrl)
      } catch (e) {
        setPhase('closed')
        setLastError(e instanceof Error ? e.message : 'Invalid WebSocket URL')
        return
      }

      wsRef.current = socket

      socket.onopen = () => {
        setPhase('handshake')
        const traceId = newTraceId()
        const joinMsg = joinRemoteEnvelope(traceId, workspaceId)
        socket.send(JSON.stringify(joinMsg))
        mirrorWire(joinMsg as unknown as Record<string, unknown>)
        pushActivity({
          kind: 'system',
          summary: 'Transport open; sent session.join (remote)',
        })
      }

      socket.onmessage = (ev) => {
        const text = String(ev.data)
        let env: Record<string, unknown> | null = null
        try {
          env = JSON.parse(text) as Record<string, unknown>
        } catch {
          /* ignore */
        }
        const parsed = parseIncoming(text)
        if (parsed) applyEvent(parsed)
        if (env) mirrorWire(env)
      }

      socket.onerror = () => {
        setLastError('WebSocket error')
        pushActivity({ kind: 'system', summary: 'WebSocket error' })
      }

      socket.onclose = () => {
        if (wsRef.current === socket) wsRef.current = null
        boundSessionRef.current = null
        setPhase((p) => (p === 'idle' ? p : 'closed'))
        pushActivity({ kind: 'system', summary: 'WebSocket closed' })
      }
    },
    [applyEvent, disconnect, mirrorWire, pushActivity],
  )

  const submitTask = useCallback(
    (intent: string, workspaceId?: WorkspaceId) => {
      const ws = wsRef.current
      const sessionId = boundSessionRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || !sessionId) {
        setLastError('Not connected or session not joined yet')
        return
      }
      const trimmed = intent.trim()
      if (!trimmed) return

      const clientTaskRef = `ui-${crypto.randomUUID().slice(0, 8)}`
      setTasks((prev) => ({
        ...prev,
        [clientTaskRef]: {
          id: clientTaskRef,
          phase: 'submitted',
          clientTaskRef,
          intent: trimmed,
          detail: 'Submitted',
        },
      }))

      const out = taskSubmitEnvelope(
        newTraceId(),
        sessionId,
        workspaceId,
        trimmed,
        clientTaskRef,
      )
      ws.send(JSON.stringify(out))
      mirrorWire(out as unknown as Record<string, unknown>)
      pushActivity({
        kind: 'event',
        summary: 'task.submit',
        payloadPreview: JSON.stringify({ intent: trimmed, clientTaskRef }),
      })
    },
    [mirrorWire, pushActivity],
  )

  return {
    phase,
    lastError,
    tasks,
    activity,
    activeWorkspaceId,
    connect,
    disconnect,
    submitTask,
  }
}

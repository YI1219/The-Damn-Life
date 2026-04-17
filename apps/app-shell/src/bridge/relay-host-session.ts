import type {
  PermissionResolvedPayload,
  SessionJoinPayload,
  WsMessage,
} from '@the-damn-life/event-contracts'
import { appendHostAuditLine } from './host-audit.js'
import type { HostPermissionPolicy } from './host-policy.js'
import { parseWsText, wireBase } from './wire.js'

export type RelayHostSessionHandlers = {
  /** Deliver relay → runtime messages here when RuntimeAgent wires a local transport. */
  onRuntimeWire?: (message: WsMessage) => void | Promise<void>
  onPermissionResolved?: (payload: PermissionResolvedPayload) => void
  /** Fired after `session.joined`; `sessionId` comes from the wire envelope per contract. */
  onSessionJoined?: (sessionId: string | undefined, workspaceId?: string) => void
  /** Optional sync-service mirror (best-effort); not invoked for `permission.*`. */
  mirrorEnvelope?: (message: WsMessage) => void
  onError?: (message: string) => void
}

export class RelayHostSession {
  private ws: WebSocket | null = null
  private sessionId: string | undefined
  private readonly permissionPolicy: HostPermissionPolicy
  private readonly handlers: RelayHostSessionHandlers

  constructor(
    permissionPolicy: HostPermissionPolicy,
    handlers: RelayHostSessionHandlers = {},
  ) {
    this.permissionPolicy = permissionPolicy
    this.handlers = handlers
  }

  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  get activeSessionId(): string | undefined {
    return this.sessionId
  }

  async connect(
    url: string,
    join: Pick<SessionJoinPayload, 'workspaceId' | 'capabilities'>,
  ): Promise<void> {
    await appendHostAuditLine({
      action: 'relay.connect.requested',
      outcome: 'success',
      resource: url,
      actor: { kind: 'system', subject: 'app-shell' },
    })

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      this.ws = ws
      ws.addEventListener('open', () => {
        const joinMsg = {
          ...wireBase(),
          type: 'session.join' as const,
          payload: {
            clientRole: 'host_runtime' as const,
            ...join,
          },
        }
        ws.send(JSON.stringify(joinMsg))
        this.handlers.mirrorEnvelope?.(joinMsg)
        void appendHostAuditLine({
          action: 'relay.session.join_sent',
          outcome: 'success',
          detail: { clientRole: 'host_runtime' },
          actor: { kind: 'system', subject: 'app-shell' },
        })
        resolve()
      })
      ws.addEventListener('error', () => {
        this.ws = null
        void appendHostAuditLine({
          action: 'relay.ws_error',
          outcome: 'failure',
          resource: url,
          actor: { kind: 'system', subject: 'app-shell' },
        })
        reject(new Error('WebSocket error'))
      })
      ws.addEventListener('message', (ev) => {
        void this.onMessage(ev.data as string).catch((e: unknown) => {
          this.handlers.onError?.(e instanceof Error ? e.message : String(e))
        })
      })
      ws.addEventListener('close', () => {
        this.sessionId = undefined
        this.ws = null
      })
    })
  }

  sendToRelay(message: WsMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.handlers.onError?.('relay not connected')
      return
    }
    this.ws.send(JSON.stringify(message))
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this.sessionId = undefined
  }

  private async onMessage(raw: string): Promise<void> {
    const parsed = parseWsText(raw)
    if (!parsed.ok) {
      this.handlers.onError?.(parsed.error)
      return
    }
    const msg = parsed.message

    if (msg.type === 'session.joined') {
      const sid = msg.sessionId
      if (sid) this.sessionId = sid
      this.handlers.mirrorEnvelope?.(msg)
      this.handlers.onSessionJoined?.(sid, msg.payload.workspaceId)
      void appendHostAuditLine({
        action: 'relay.session.joined',
        outcome: 'success',
        detail: { sessionId: sid, workspaceId: msg.payload.workspaceId },
        actor: { kind: 'system', subject: 'app-shell' },
      })
      return
    }

    if (msg.type === 'permission.requested') {
      await this.handlePermissionRequested(msg)
      return
    }

    if (msg.type === 'system.error') {
      void appendHostAuditLine({
        action: 'relay.system_error',
        outcome: 'failure',
        detail: { code: msg.payload.code, message: msg.payload.message },
        actor: { kind: 'system', subject: 'relay' },
      })
      return
    }

    this.handlers.mirrorEnvelope?.(msg)
    await Promise.resolve(this.handlers.onRuntimeWire?.(msg))
  }

  private async handlePermissionRequested(
    msg: Extract<WsMessage, { type: 'permission.requested' }>,
  ): Promise<void> {
    const payload = msg.payload
    const decision = await this.permissionPolicy.resolvePermissionRequest(
      payload,
      { traceId: msg.traceId, sessionId: msg.sessionId ?? this.sessionId },
    )
    void appendHostAuditLine({
      action: 'permission.resolved',
      outcome: decision === 'grant' ? 'success' : 'denied',
      detail: {
        permissionId: payload.permissionId,
        decision,
        scope: payload.scope,
      },
      actor: { kind: 'system', subject: 'app-shell' },
      taskId: payload.taskId,
    })

    const resolved: WsMessage = {
      ...wireBase({
        traceId: msg.traceId,
        correlationId: msg.correlationId,
        sessionId: msg.sessionId ?? this.sessionId,
        workspaceId: msg.workspaceId,
      }),
      type: 'permission.resolved',
      payload: {
        permissionId: payload.permissionId,
        decision,
      },
    }
    this.sendToRelay(resolved)
    this.handlers.onPermissionResolved?.(resolved.payload)
  }
}

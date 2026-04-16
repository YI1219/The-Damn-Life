import {
  CONTRACT_VERSION,
  type SessionId,
  type WireEnvelopeBase,
  type WorkspaceId,
} from '@the-damn-life/event-contracts'

export function newTraceId(): string {
  return crypto.randomUUID()
}

export function baseFields(traceId: string): Pick<
  WireEnvelopeBase,
  'contractVersion' | 'timestamp' | 'traceId'
> {
  return {
    contractVersion: CONTRACT_VERSION,
    timestamp: new Date().toISOString(),
    traceId,
  }
}

export function joinRemoteEnvelope(
  traceId: string,
  workspaceId?: WorkspaceId,
) {
  return {
    ...baseFields(traceId),
    type: 'session.join' as const,
    payload: {
      clientRole: 'remote' as const,
      ...(workspaceId ? { workspaceId } : {}),
    },
  }
}

export function taskSubmitEnvelope(
  traceId: string,
  sessionId: SessionId,
  workspaceId: WorkspaceId | undefined,
  intent: string,
  clientTaskRef?: string,
) {
  return {
    ...baseFields(traceId),
    sessionId,
    ...(workspaceId ? { workspaceId } : {}),
    type: 'task.submit' as const,
    payload: {
      intent,
      ...(clientTaskRef ? { clientTaskRef } : {}),
    },
  }
}

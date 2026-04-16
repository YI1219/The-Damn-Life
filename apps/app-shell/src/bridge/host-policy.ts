import type { PermissionRequestedPayload } from '@the-damn-life/event-contracts'

/** Host-side explicit permission gate: never silent grant. */
export interface HostPermissionPolicy {
  resolvePermissionRequest(
    payload: PermissionRequestedPayload,
    context: { traceId: string; sessionId?: string },
  ): Promise<'grant' | 'deny'>
}

export function createConfirmPermissionPolicy(
  confirm: (prompt: string) => Promise<boolean>,
): HostPermissionPolicy {
  return {
    async resolvePermissionRequest(payload) {
      const ok = await confirm(
        `${payload.prompt}\n\nscope: ${payload.scope}` +
          (payload.taskId ? `\ntask: ${payload.taskId}` : ''),
      )
      return ok ? 'grant' : 'deny'
    },
  }
}

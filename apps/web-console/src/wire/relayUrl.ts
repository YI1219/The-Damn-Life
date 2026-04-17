/**
 * Relay handshake: `GET /ws?session=<id>&role=remote[:<key>]|host[:<key>]`
 * (see services/relay-go/README.md and docs/protocols/websocket-events.md).
 */
export function buildRelayRemoteUrl(
  wsPathBase: string,
  sessionKey: string,
  roleKey?: string,
): string {
  const u = new URL(wsPathBase)
  u.searchParams.set('session', sessionKey)
  const rk = roleKey?.trim()
  u.searchParams.set('role', rk ? `remote:${rk}` : 'remote')
  return u.href
}

/** Split a full relay URL into base path + session (for form prefill). */
export function splitRelayRemoteUrl(full: string): {
  base: string
  session: string
  roleKey: string
} | null {
  try {
    const u = new URL(full)
    const session = u.searchParams.get('session')
    if (!session) return null
    const role = u.searchParams.get('role') ?? ''
    const roleKey =
      role.toLowerCase().startsWith('remote:') ? role.slice('remote:'.length) : ''
    const base = `${u.protocol}//${u.host}${u.pathname}`
    return { base, session, roleKey }
  } catch {
    return null
  }
}

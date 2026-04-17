/**
 * `relay-go` 握手：`GET /ws?session=<id>&role=remote[:<key>]|host[:<key>]`（Host 侧为 `host`）。
 * 默认端口与 `RELAY_ADDR` 默认 `:8765` 一致；`session` 须与 Remote 侧相同方可配对。
 */
export function buildRelayHostWsUrl(options?: {
  host?: string
  port?: number
  sessionId?: string
  roleKey?: string
}): string {
  const host = options?.host ?? '127.0.0.1'
  const port = options?.port ?? 8765
  const sessionId = options?.sessionId ?? 'demo'
  const rk = options?.roleKey?.trim()
  const role = rk ? `host:${rk}` : 'host'
  const q = new URLSearchParams({ session: sessionId, role })
  return `ws://${host}:${port}/ws?${q.toString()}`
}

export type HostAuditEntry = Record<string, unknown>

export async function appendHostAuditLine(entry: HostAuditEntry): Promise<void> {
  const line = JSON.stringify({
    ...entry,
    ts: new Date().toISOString(),
  })
  const tauri = (globalThis as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__
  if (!tauri) {
    console.info('[host-audit]', line)
    return
  }
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('append_host_audit_line', { line })
}

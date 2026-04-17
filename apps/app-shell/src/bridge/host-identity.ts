const HOST_ID_KEY = 'tdl:hostId'

export type HostId = string

export function getOrCreateHostId(): HostId {
  try {
    const existing = localStorage.getItem(HOST_ID_KEY)
    if (existing && existing.trim()) return existing
  } catch {
    // ignore
  }
  const id = crypto.randomUUID()
  try {
    localStorage.setItem(HOST_ID_KEY, id)
  } catch {
    // ignore
  }
  return id
}


export type StoredEvent = {
  seq: number
  receivedAt: string
  workspaceId: string
  sessionId?: string
  source: string
  type: string
  traceId?: string
  envelope: Record<string, unknown>
}

export class EventStore {
  private seq = 0
  private readonly items: StoredEvent[] = []
  private readonly maxItems: number

  constructor(maxItems = 10_000) {
    this.maxItems = maxItems
  }

  append(input: {
    workspaceId: string
    sessionId?: string
    source: string
    envelope: Record<string, unknown>
  }): StoredEvent {
    const type = typeof input.envelope.type === 'string' ? input.envelope.type : 'unknown'
    const traceId =
      typeof input.envelope.traceId === 'string' ? input.envelope.traceId : undefined
    this.seq += 1
    const row: StoredEvent = {
      seq: this.seq,
      receivedAt: new Date().toISOString(),
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      source: input.source,
      type,
      traceId,
      envelope: input.envelope,
    }
    this.items.push(row)
    while (this.items.length > this.maxItems) this.items.shift()
    return row
  }

  query(workspaceId: string, sinceSeq = 0, limit = 200): StoredEvent[] {
    const cap = Math.min(Math.max(limit, 1), 500)
    const out: StoredEvent[] = []
    for (let i = this.items.length - 1; i >= 0 && out.length < cap; i--) {
      const it = this.items[i]!
      if (it.workspaceId !== workspaceId) continue
      if (it.seq <= sinceSeq) break
      out.push(it)
    }
    return out.reverse()
  }
}

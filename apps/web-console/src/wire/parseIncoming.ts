import { isEventType, type EventType } from '@the-damn-life/event-contracts'

export type ParsedWire = {
  type: EventType | 'unknown'
  raw: Record<string, unknown>
}

export function parseIncoming(data: string): ParsedWire | null {
  try {
    const raw = JSON.parse(data) as unknown
    if (!raw || typeof raw !== 'object') return null
    const o = raw as Record<string, unknown>
    const t = o.type
    if (typeof t !== 'string') return { type: 'unknown', raw: o }
    if (isEventType(t)) return { type: t, raw: o }
    return { type: 'unknown', raw: o }
  } catch {
    return null
  }
}

import assert from 'node:assert/strict'
import test from 'node:test'

import { EventStore } from './eventStore.js'

test('EventStore.query returns events newer than sinceSeq for workspace', () => {
  const s = new EventStore(100)
  s.append({
    workspaceId: 'ws-1',
    source: 'test',
    envelope: { type: 'a', traceId: 't1' },
  })
  s.append({
    workspaceId: 'ws-2',
    source: 'test',
    envelope: { type: 'b' },
  })
  const second = s.append({
    workspaceId: 'ws-1',
    source: 'test',
    envelope: { type: 'c' },
  })
  const rows = s.query('ws-1', 1, 50)
  assert.equal(rows.length, 1)
  assert.equal(rows[0]!.seq, second.seq)
  assert.equal(rows[0]!.type, 'c')
})

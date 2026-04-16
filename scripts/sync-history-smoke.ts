import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return
    } catch {
      // ignore until timeout
    }
    await sleep(200)
  }
  throw new Error(`timeout waiting for http ${url}`)
}

function pickRandomPort(): number {
  return 20_000 + Math.floor(Math.random() * 20_000)
}

async function postEvent(base: string, body: unknown): Promise<Response> {
  return fetch(`${base}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function getEvents(
  base: string,
  workspaceId: string,
  opts?: { sinceSeq?: number; limit?: number },
): Promise<unknown> {
  const u = new URL(`${base}/v1/events`)
  u.searchParams.set('workspaceId', workspaceId)
  u.searchParams.set('sinceSeq', String(opts?.sinceSeq ?? 0))
  u.searchParams.set('limit', String(opts?.limit ?? 200))
  const res = await fetch(u)
  if (!res.ok) throw new Error(`GET /v1/events failed: ${res.status}`)
  return res.json()
}

type HistoryItem = {
  seq: number
  type?: string
  envelope?: Record<string, unknown>
}

function payloadAction(row: HistoryItem): string | undefined {
  const p = row.envelope?.payload
  if (p && typeof p === 'object' && 'action' in p) {
    return String((p as { action: unknown }).action)
  }
  return undefined
}

async function main(): Promise<void> {
  const port = Number(process.env.SYNC_SMOKE_PORT ?? String(pickRandomPort()))
  const base = `http://127.0.0.1:${port}`
  const baseOffline = `http://127.0.0.1:${port + 1}`
  const workspaceId = process.env.SYNC_SMOKE_WORKSPACE_ID ?? `ws-${randomUUID().slice(0, 8)}`
  const sessionId = `sess-${randomUUID().slice(0, 8)}`

  process.stdout.write(`\nSYNC_SMOKE base=${base}\n`)
  process.stdout.write(`SYNC_SMOKE workspaceId=${workspaceId}\n`)

  const svc = spawn('node', ['--import', 'tsx', 'src/main.ts'], {
    cwd: resolve(process.cwd(), 'services/sync-service'),
    env: { ...process.env, SYNC_HOST: '127.0.0.1', SYNC_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  svc.stderr?.on('data', (c) => process.stderr.write(String(c)))
  svc.stdout?.on('data', (c) => process.stdout.write(String(c)))

  try {
    await waitForHttp(`${base}/health`, 8_000)

    // Online: write two events.
    const env1 = {
      contractVersion: '0.1.0',
      timestamp: new Date().toISOString(),
      traceId: randomUUID(),
      type: 'audit.record',
      sessionId,
      workspaceId,
      payload: { action: 'sync.smoke.1' },
    }
    const env2 = {
      contractVersion: '0.1.0',
      timestamp: new Date().toISOString(),
      traceId: randomUUID(),
      type: 'task.completed',
      sessionId,
      workspaceId,
      payload: { taskId: 't-1', resultSummary: 'ok' },
    }

    const r1 = await postEvent(base, {
      workspaceId,
      sessionId,
      source: 'sync-history-smoke',
      envelope: env1,
    })
    if (!r1.ok) throw new Error(`POST #1 failed: ${r1.status}`)
    const r2 = await postEvent(base, {
      workspaceId,
      sessionId,
      source: 'sync-history-smoke',
      envelope: env2,
    })
    if (!r2.ok) throw new Error(`POST #2 failed: ${r2.status}`)

    // Offline (client): POST should fail (best-effort clients must tolerate).
    let offlineFailed = false
    try {
      await postEvent(baseOffline, {
        workspaceId,
        sessionId,
        source: 'sync-history-smoke',
        envelope: { type: 'audit.record', payload: { action: 'offline' } },
      })
    } catch {
      offlineFailed = true
    }
    if (!offlineFailed) {
      throw new Error('expected offline POST to fail')
    }

    // Back online (client): query should contain the two online events.
    const out = (await getEvents(base, workspaceId)) as { items?: HistoryItem[] }
    const items0 = out.items ?? []
    const types = items0.map((i) => i.type).filter(Boolean)
    if (!types.includes('audit.record') || !types.includes('task.completed')) {
      throw new Error(`expected history to include two event types; got=${JSON.stringify(types)}`)
    }

    const maxSeq =
      items0.length > 0 ? Math.max(...items0.map((i) => i.seq)) : 0

    // Recover: after client-side failure, POST succeeds again and incremental GET catches up.
    const env3 = {
      contractVersion: '0.1.0',
      timestamp: new Date().toISOString(),
      traceId: randomUUID(),
      type: 'audit.record',
      sessionId,
      workspaceId,
      payload: { action: 'sync.smoke.recover' },
    }
    const r3 = await postEvent(base, {
      workspaceId,
      sessionId,
      source: 'sync-history-smoke',
      envelope: env3,
    })
    if (!r3.ok) throw new Error(`POST recover failed: ${r3.status}`)

    const delta = (await getEvents(base, workspaceId, {
      sinceSeq: maxSeq,
      limit: 50,
    })) as { items?: HistoryItem[] }
    const deltaItems = delta.items ?? []
    const recoverSeen = deltaItems.some(
      (i) => payloadAction(i) === 'sync.smoke.recover',
    )
    if (!recoverSeen) {
      throw new Error(
        `expected incremental history after recover; sinceSeq=${maxSeq} got=${JSON.stringify(
          deltaItems.map((i) => ({ seq: i.seq, action: payloadAction(i) })),
        )}`,
      )
    }

    const full = (await getEvents(base, workspaceId)) as { items?: HistoryItem[] }
    const n = full.items?.length ?? 0
    if (n < 3) {
      throw new Error(`expected at least 3 stored rows after recover; got ${n}`)
    }

    process.stdout.write(
      `SYNC_SMOKE_OK types=${JSON.stringify(types)} recover_delta=${deltaItems.length} total=${n}\n`,
    )
  } finally {
    try {
      svc.kill('SIGTERM')
    } catch {
      // ignore
    }
  }
}

main().catch((e) => {
  process.stderr.write(`SYNC_SMOKE_FATAL ${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exitCode = 1
})


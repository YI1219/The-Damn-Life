import { execSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function* streamLines(stream: NodeJS.ReadableStream): AsyncGenerator<string> {
  let buf = ''
  for await (const chunk of stream) {
    buf += String(chunk)
    while (true) {
      const idx = buf.indexOf('\n')
      if (idx < 0) break
      const line = buf.slice(0, idx)
      buf = buf.slice(idx + 1)
      yield line
    }
  }
  if (buf) yield buf
}

async function waitForHttp(
  url: string,
  timeoutMs: number,
): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'OPTIONS' })
      if (res.ok || res.status === 204 || res.status === 404 || res.status === 405) {
        return
      }
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

type Wire = {
  contractVersion: '0.1.0'
  timestamp: string
  traceId: string
  type: string
  payload: Record<string, unknown>
  sessionId?: string
  workspaceId?: string
  correlationId?: string
}

function base(type: string, payload: Record<string, unknown>, extra: Partial<Wire> = {}): Wire {
  return {
    contractVersion: '0.1.0',
    timestamp: new Date().toISOString(),
    traceId: randomUUID(),
    type,
    payload,
    ...extra,
  }
}

async function main(): Promise<void> {
  const session = process.env.E2E_SESSION ?? `e2e-${randomUUID().slice(0, 8)}`
  const workspaceId = process.env.E2E_WORKSPACE_ID ?? `ws-${session.slice(-4)}`
  const relayPort0 = Number(process.env.E2E_RELAY_PORT ?? String(pickRandomPort()))
  const runtimePort0 = Number(process.env.E2E_RUNTIME_PORT ?? String(pickRandomPort()))
  const useGitHttp1 = process.env.GIT_HTTP_VERSION === 'HTTP/1.1'

  process.stdout.write(`\nE2E session=${session}\n`)
  process.stdout.write(`E2E workspaceId=${workspaceId}\n`)
  process.stdout.write(`runtime bridge(port hint)=${runtimePort0}\n\n`)

  const relayEnvBase = {
    ...process.env,
    RELAY_DEBUG: process.env.RELAY_DEBUG ?? '1',
    ...(useGitHttp1 ? { GIT_HTTP_VERSION: 'HTTP/1.1' } : {}),
  }
  const runtimeEnvBase = {
    ...process.env,
    RUNTIME_BRIDGE_HOST: '127.0.0.1',
  }

  const resolvedGo = execSync('which go', { encoding: 'utf-8' })
    .replace(/\r?\n/g, '')
    .trim()
  const goBin =
    resolvedGo && existsSync(resolvedGo) ? resolvedGo : '/opt/homebrew/bin/go'

  let relayPort = relayPort0
  let relay: ReturnType<typeof spawn> | null = null
  for (let i = 0; i < 8; i++) {
    relay = spawn(goBin, ['run', './cmd/relay'], {
      cwd: resolve(process.cwd(), 'services/relay-go'),
      env: { ...relayEnvBase, RELAY_ADDR: `:${relayPort}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    relay.on('error', (e) => {
      process.stderr.write(
        `E2E_RELAY_SPAWN_ERROR goBin=${JSON.stringify(goBin)} err=${String(e)}\n`,
      )
    })
    void (async () => {
      for await (const l of streamLines(relay!.stderr!))
        process.stderr.write(`[relay] ${l}\n`)
    })()
    void (async () => {
      for await (const l of streamLines(relay!.stdout!))
        process.stderr.write(`[relay:out] ${l}\n`)
    })()
    try {
      await waitForHttp(`http://127.0.0.1:${relayPort}/health`, 8_000)
      break
    } catch {
      try {
        relay.kill('SIGTERM')
      } catch {
        // ignore
      }
      relay = null
      relayPort = pickRandomPort()
    }
  }
  if (!relay) throw new Error('failed to start relay-go')

  const relayWsBase = `ws://127.0.0.1:${relayPort}/ws?session=${encodeURIComponent(session)}&role=`
  process.stdout.write(`relay-go addr=:${relayPort}\n`)

  let runtimePort = runtimePort0
  let runtime: ReturnType<typeof spawn> | null = null
  for (let i = 0; i < 8; i++) {
    runtime = spawn('python3', ['-m', 'src.bridge_http'], {
      cwd: resolve(process.cwd(), 'services/runtime-py'),
      env: { ...runtimeEnvBase, RUNTIME_BRIDGE_PORT: String(runtimePort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    void (async () => {
      for await (const l of streamLines(runtime!.stderr!))
        process.stderr.write(`[runtime] ${l}\n`)
    })()
    void (async () => {
      for await (const l of streamLines(runtime!.stdout!))
        process.stderr.write(`[runtime:out] ${l}\n`)
    })()
    try {
      await waitForHttp(`http://127.0.0.1:${runtimePort}/handle`, 8_000)
      break
    } catch {
      try {
        runtime.kill('SIGTERM')
      } catch {
        // ignore
      }
      runtime = null
      runtimePort = pickRandomPort()
    }
  }
  if (!runtime) throw new Error('failed to start runtime bridge')
  const runtimeBase = `http://127.0.0.1:${runtimePort}`
  process.stdout.write(`runtime bridge=${runtimeBase}\n`)

  // Use Node's built-in WebSocket (Node >= 22).
  const WebSocketCtor = globalThis.WebSocket
  if (!WebSocketCtor) {
    throw new Error('Node WebSocket not available; require Node >= 22')
  }

  const host = new WebSocketCtor(`${relayWsBase}host:a`)
  const remote = new WebSocketCtor(`${relayWsBase}remote:a`)
  const hostB = new WebSocketCtor(`${relayWsBase}host:b`)
  const remoteB = new WebSocketCtor(`${relayWsBase}remote:b`)

  const seen = new Set<string>()
  const missingWorkspace: Array<{ type: string; got: unknown }> = []
  const hostId = randomUUID()
  const hostId2 = randomUUID()
  let hostOpened = false
  let remoteOpened = false
  let sawHostJoinOnRemote = false
  let sawHost2JoinOnRemote = false
  let sawTaskCompleteA = false
  let sawTaskCompleteB = false
  let done = false

  const cleanup = () => {
    if (done) return
    done = true
    try {
      host.close()
    } catch {
      // ignore
    }
    try {
      hostB.close()
    } catch {
      // ignore
    }
    try {
      remote.close()
    } catch {
      // ignore
    }
    try {
      remoteB.close()
    } catch {
      // ignore
    }
    try {
      relay?.kill('SIGTERM')
    } catch {
      // ignore
    }
    try {
      runtime.kill('SIGTERM')
    } catch {
      // ignore
    }
  }

  const timeout = setTimeout(() => {
    cleanup()
    process.stderr.write(`E2E_TIMEOUT seen=${JSON.stringify(Array.from(seen))}\n`)
    process.exitCode = 1
  }, 20_000)

  function maybeJoin1(): void {
    if (!hostOpened || !remoteOpened) return
    host.send(
      JSON.stringify(
        base('session.join', {
          clientRole: 'host_runtime',
          workspaceId,
          capabilities: `hostId=${hostId}`,
        }),
      ),
    )
    remote.send(
      JSON.stringify(base('session.join', { clientRole: 'remote', workspaceId })),
    )
  }

  host.addEventListener('open', () => {
    hostOpened = true
    maybeJoin1()
  })
  remote.addEventListener('open', () => {
    remoteOpened = true
    maybeJoin1()
  })

  async function bridgeRuntimeAndReplyHost(
    hostWs: WebSocket,
    ev: MessageEvent,
  ): Promise<void> {
    const msg = JSON.parse(String(ev.data)) as Wire
    if (msg.type !== 'task.submit') return
    const res = await fetch(`${runtimeBase}/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    })
    const text = await res.text()
    for (const line of text.split('\n')) {
      const ln = line.trim()
      if (!ln) continue
      hostWs.send(ln)
    }
  }

  host.addEventListener('message', (ev) => {
    void bridgeRuntimeAndReplyHost(host, ev)
  })
  hostB.addEventListener('message', (ev) => {
    void bridgeRuntimeAndReplyHost(hostB, ev)
  })

  function tryFinish(): void {
    if (done) return
    if (!sawTaskCompleteA || !sawTaskCompleteB) return
    if (missingWorkspace.length > 0) {
      process.stderr.write(
        `E2E_WORKSPACE_MISMATCH ${JSON.stringify(missingWorkspace)}\n`,
      )
      clearTimeout(timeout)
      cleanup()
      process.exitCode = 1
      setTimeout(() => process.exit(1), 50)
      return
    }
    if (!sawHostJoinOnRemote) {
      process.stderr.write('E2E_MISSING_HOST_JOIN\n')
      clearTimeout(timeout)
      cleanup()
      process.exitCode = 1
      setTimeout(() => process.exit(1), 50)
      return
    }
    if (!sawHost2JoinOnRemote) {
      process.stderr.write('E2E_MISSING_HOST2_JOIN\n')
      clearTimeout(timeout)
      cleanup()
      process.exitCode = 1
      setTimeout(() => process.exit(1), 50)
      return
    }
    process.stdout.write(`E2E_OK seen=${Array.from(seen).sort().join(',')}\n`)
    clearTimeout(timeout)
    cleanup()
    process.exitCode = 0
    setTimeout(() => process.exit(0), 50)
  }

  function observeRemote(pair: 'a' | 'b', ev: MessageEvent): void {
    const msg = JSON.parse(String(ev.data)) as Wire
    seen.add(msg.type)
    if (
      msg.type !== 'system.error' &&
      msg.type !== 'session.join' &&
      msg.type !== 'session.joined' &&
      msg.workspaceId !== workspaceId
    ) {
      missingWorkspace.push({ type: msg.type, got: msg.workspaceId })
    }
    if (msg.type === 'session.join') {
      const clientRole = msg.payload?.clientRole
      const capabilities = msg.payload?.capabilities
      if (clientRole === 'host_runtime' && capabilities === `hostId=${hostId}`) {
        sawHostJoinOnRemote = true
      }
      if (clientRole === 'host_runtime' && capabilities === `hostId=${hostId2}`) {
        sawHost2JoinOnRemote = true
      }
    }
    if (msg.type === 'system.error') {
      process.stderr.write(
        `E2E_SYSTEM_ERROR pair=${pair} ${JSON.stringify(msg.payload)}\n`,
      )
      clearTimeout(timeout)
      cleanup()
      process.exitCode = 1
      setTimeout(() => process.exit(1), 50)
      return
    }
    if (msg.type === 'task.completed') {
      if (pair === 'a') sawTaskCompleteA = true
      else sawTaskCompleteB = true
      tryFinish()
    }
  }

  remote.addEventListener('message', (ev) => observeRemote('a', ev))
  remoteB.addEventListener('message', (ev) => observeRemote('b', ev))

  // Join pair B once its sockets are open.
  hostB.addEventListener('open', () => {
    hostB.send(
      JSON.stringify(
        base('session.join', {
          clientRole: 'host_runtime',
          workspaceId,
          capabilities: `hostId=${hostId2}`,
        }),
      ),
    )
  })
  remoteB.addEventListener('open', () => {
    remoteB.send(
      JSON.stringify(base('session.join', { clientRole: 'remote', workspaceId })),
    )
  })

  // Give both pairs time to connect + join.
  await sleep(600)
  remote.send(
    JSON.stringify(
      base(
        'task.submit',
        { intent: 'smoke', clientTaskRef: 'ref-1' },
        { sessionId: session, workspaceId },
      ),
    ),
  )
  remoteB.send(
    JSON.stringify(
      base(
        'task.submit',
        { intent: 'smoke-b', clientTaskRef: 'ref-2' },
        { sessionId: session, workspaceId },
      ),
    ),
  )
}

main().catch((e) => {
  process.stderr.write(`E2E_FATAL ${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exitCode = 1
})


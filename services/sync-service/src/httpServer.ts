import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { EventStore, type StoredEvent } from './eventStore.js'

function readJsonBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > maxBytes) {
        reject(new Error('payload_too_large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8')
      if (!raw.trim()) {
        resolve(null)
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const b = Buffer.from(JSON.stringify(body), 'utf-8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(b.length),
  })
  res.end(b)
}

function cors(res: ServerResponse, allowOrigin: string): void {
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export type SyncServerOptions = {
  store?: EventStore
  allowOrigin?: string
  maxBodyBytes?: number
}

export function createSyncHttpServer(opts: SyncServerOptions = {}) {
  const store = opts.store ?? new EventStore()
  const allowOrigin = opts.allowOrigin ?? '*'
  const maxBody = opts.maxBodyBytes ?? 512 * 1024

  return createServer(async (req, res) => {
    cors(res, allowOrigin)
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end()
      return
    }

    const url = new URL(req.url ?? '/', 'http://127.0.0.1')

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        sendJson(res, 200, { status: 'ok' })
        return
      }

      if (req.method === 'POST' && url.pathname === '/v1/events') {
        const raw = await readJsonBody(req, maxBody)
        if (!raw || typeof raw !== 'object') {
          sendJson(res, 400, { error: 'invalid_json' })
          return
        }
        const body = raw as Record<string, unknown>
        const workspaceId =
          typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''
        if (!workspaceId) {
          sendJson(res, 400, { error: 'workspaceId_required' })
          return
        }
        const sessionId =
          typeof body.sessionId === 'string' ? body.sessionId.trim() : undefined
        const source =
          typeof body.source === 'string' && body.source.trim()
            ? body.source.trim()
            : 'unknown'
        const envelope = body.envelope
        if (!envelope || typeof envelope !== 'object') {
          sendJson(res, 400, { error: 'envelope_required' })
          return
        }
        const row = store.append({
          workspaceId,
          sessionId,
          source,
          envelope: envelope as Record<string, unknown>,
        })
        sendJson(res, 201, { ok: true, seq: row.seq })
        return
      }

      if (req.method === 'GET' && url.pathname === '/v1/events') {
        const workspaceId = (url.searchParams.get('workspaceId') ?? '').trim()
        if (!workspaceId) {
          sendJson(res, 400, { error: 'workspaceId_required' })
          return
        }
        const sinceSeq = Number(url.searchParams.get('sinceSeq') ?? '0')
        const limit = Number(url.searchParams.get('limit') ?? '200')
        const rows = store.query(workspaceId, Number.isFinite(sinceSeq) ? sinceSeq : 0, limit)
        const payload: StoredEvent[] = rows.map((r) => ({ ...r }))
        sendJson(res, 200, { items: payload })
        return
      }

      sendJson(res, 404, { error: 'not_found' })
    } catch (e) {
      if (e instanceof Error && e.message === 'payload_too_large') {
        sendJson(res, 413, { error: 'payload_too_large' })
        return
      }
      sendJson(res, 400, { error: 'bad_request' })
    }
  })
}

import { createSyncHttpServer } from './httpServer.js'

const host = process.env.SYNC_HOST ?? '127.0.0.1'
const port = Number(process.env.SYNC_PORT ?? '9797')
const allowOrigin = process.env.SYNC_ALLOW_ORIGIN ?? '*'

const server = createSyncHttpServer({ allowOrigin })

server.listen(port, host, () => {
  process.stderr.write(
    `# sync-service listening on http://${host}:${port} (POST /v1/events, GET /v1/events?workspaceId=)\n`,
  )
})

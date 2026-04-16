/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** e.g. `ws://127.0.0.1:8765/ws` — `session` and `role=remote` are appended on connect */
  readonly VITE_RELAY_WS_BASE?: string
  /** e.g. `http://127.0.0.1:9797` — sync-service mirror + History (optional) */
  readonly VITE_SYNC_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

import {
  DEFAULT_SYNC_BASE_URL,
  RelayHostSession,
  appendHostAuditLine,
  buildRelayHostWsUrl,
  createConfirmPermissionPolicy,
  forwardEnvelopeToRuntime,
  getOrCreateHostId,
  mirrorWireEnvelopeBestEffort,
  type SyncMirrorConfig,
} from './bridge/index.js'

function uiConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'tdl-modal-overlay'
    overlay.innerHTML = `
      <div class="tdl-modal" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="tdl-modal-title">${title}</div>
        <pre class="tdl-modal-message"></pre>
        <div class="tdl-modal-actions">
          <button type="button" data-action="deny">取消</button>
          <button type="button" data-action="allow" class="primary">允许</button>
        </div>
      </div>
    `
    const pre = overlay.querySelector<HTMLPreElement>('.tdl-modal-message')!
    pre.textContent = message

    function cleanup(result: boolean): void {
      overlay.remove()
      resolve(result)
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false)
    })
    overlay
      .querySelector<HTMLButtonElement>('[data-action="deny"]')!
      .addEventListener('click', () => cleanup(false))
    overlay
      .querySelector<HTMLButtonElement>('[data-action="allow"]')!
      .addEventListener('click', () => cleanup(true))

    document.body.appendChild(overlay)
  })
}

const root = document.querySelector<HTMLDivElement>('#root')!
root.innerHTML = `
  <div class="host-panel">
    <h1>The Damn Life — Host</h1>
    <p class="hint">Host id: <code id="host-id"></code></p>
    <p class="hint">Relay 与 Runtime HTTP（填写基址时）均需你显式确认出站；权限请求不会静默放行。</p>
    <label>Role key (optional; enables multi-pair within one session)
      <input id="role-key" type="text" size="24" autocomplete="off" placeholder="(empty = default)" />
    </label>
    <label>Relay WebSocket URL
      <input id="relay-url" type="text" size="72" autocomplete="off" />
    </label>
    <label>Runtime bridge (runtime-py HTTP, optional)
      <input id="runtime-bridge" type="text" size="72" autocomplete="off" placeholder="http://127.0.0.1:9876" />
    </label>
    <label class="inline-check">
      <input id="sync-mirror-enabled" type="checkbox" />
     启用 sync-service 事件镜像（默认关闭；失败不影响主链路）
    </label>
    <label>Sync base URL（默认端口 9797）
      <input id="sync-base-url" type="text" size="72" autocomplete="off" placeholder="http://127.0.0.1:9797" />
    </label>
    <div class="row">
      <button id="btn-connect" type="button">连接 Relay</button>
      <button id="btn-disconnect" type="button" disabled>断开</button>
    </div>
    <pre id="log" class="log"></pre>
  </div>
`

const style = document.createElement('style')
style.textContent = `
  .host-panel { font-family: system-ui, sans-serif; padding: 1rem 1.25rem; max-width: 52rem; }
  .hint { color: #444; font-size: 0.9rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; margin: 1rem 0; }
  input { padding: 0.4rem 0.5rem; }
  .inline-check { flex-direction: row; align-items: center; gap: 0.5rem; }
  .inline-check input { width: auto; }
  .row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
  .log { background: #111; color: #e8e8e8; padding: 0.75rem; min-height: 12rem; overflow: auto; font-size: 0.8rem; }
  .tdl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: grid; place-items: center; z-index: 9999; }
  .tdl-modal { background: #fff; width: min(44rem, 92vw); border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); padding: 1rem; }
  .tdl-modal-title { font-weight: 650; margin-bottom: 0.5rem; }
  .tdl-modal-message { white-space: pre-wrap; background: #f6f7f9; border-radius: 10px; padding: 0.75rem; max-height: 40vh; overflow: auto; }
  .tdl-modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.8rem; }
  .tdl-modal-actions button { padding: 0.45rem 0.75rem; }
  .tdl-modal-actions .primary { background: #0ea5e9; color: white; border: 1px solid #0ea5e9; border-radius: 10px; }
`
document.head.appendChild(style)

const logEl = document.querySelector<HTMLPreElement>('#log')!
const hostId = getOrCreateHostId()
document.querySelector<HTMLElement>('#host-id')!.textContent = hostId
const roleKeyInput = document.querySelector<HTMLInputElement>('#role-key')!
roleKeyInput.value =
  typeof localStorage !== 'undefined' ? localStorage.getItem('tdl:relayRoleKey') ?? '' : ''
const urlInput = document.querySelector<HTMLInputElement>('#relay-url')!
urlInput.value = buildRelayHostWsUrl({ roleKey: roleKeyInput.value })
const runtimeBridgeInput =
  document.querySelector<HTMLInputElement>('#runtime-bridge')!
runtimeBridgeInput.value =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('tdl:runtimeBridgeUrl') ?? 'http://127.0.0.1:9876'
    : 'http://127.0.0.1:9876'
const syncMirrorEnabledInput =
  document.querySelector<HTMLInputElement>('#sync-mirror-enabled')!
const syncBaseUrlInput = document.querySelector<HTMLInputElement>('#sync-base-url')!
syncMirrorEnabledInput.checked =
  typeof localStorage !== 'undefined' &&
  localStorage.getItem('tdl:syncMirrorEnabled') === '1'
syncBaseUrlInput.value =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('tdl:syncBaseUrl') ?? DEFAULT_SYNC_BASE_URL
    : DEFAULT_SYNC_BASE_URL
const btnConnect = document.querySelector<HTMLButtonElement>('#btn-connect')!
const btnDisconnect = document.querySelector<HTMLButtonElement>('#btn-disconnect')!

function log(line: string): void {
  logEl.textContent += `${line}\n`
  logEl.scrollTop = logEl.scrollHeight
}

const permissionPolicy = createConfirmPermissionPolicy((prompt) =>
  Promise.resolve(window.confirm(prompt)),
)

runtimeBridgeInput.addEventListener('change', () => {
  try {
    localStorage.setItem('tdl:runtimeBridgeUrl', runtimeBridgeInput.value.trim())
  } catch {
    /* ignore */
  }
})

syncMirrorEnabledInput.addEventListener('change', () => {
  try {
    localStorage.setItem(
      'tdl:syncMirrorEnabled',
      syncMirrorEnabledInput.checked ? '1' : '0',
    )
  } catch {
    /* ignore */
  }
})
syncBaseUrlInput.addEventListener('change', () => {
  try {
    localStorage.setItem('tdl:syncBaseUrl', syncBaseUrlInput.value.trim())
  } catch {
    /* ignore */
  }
})

roleKeyInput.addEventListener('change', () => {
  try {
    localStorage.setItem('tdl:relayRoleKey', roleKeyInput.value.trim())
  } catch {
    /* ignore */
  }
  urlInput.value = buildRelayHostWsUrl({ roleKey: roleKeyInput.value.trim() })
})

let session: RelayHostSession | null = null

function setConnected(connected: boolean): void {
  btnConnect.disabled = connected
  btnDisconnect.disabled = !connected
}

btnConnect.addEventListener('click', () => {
  void (async () => {
  const url = urlInput.value.trim()
  if (!url) {
    log('error: empty URL')
    return
  }
  if (
    !(await uiConfirm('允许 WebSocket 出站连接？', `目标：\n${url}`))
  ) {
    void appendHostAuditLine({
      action: 'relay.connect.denied_by_user',
      outcome: 'denied',
      resource: url,
      actor: { kind: 'system', subject: 'app-shell' },
    })
    log('connect cancelled by user')
    return
  }

  const bridgeCandidate = runtimeBridgeInput.value.trim()
  let allowedRuntimeBase: string | null = null
  if (bridgeCandidate) {
    if (
      !(await uiConfirm(
        '允许 Runtime HTTP 出站转发？',
        `将会请求：POST ${bridgeCandidate.replace(/\/$/, '')}/handle\n\n说明：仅对 task.submit 生效，用于本地把任务交给 runtime-py bridge_http 执行并回流事件。`,
      ))
    ) {
      void appendHostAuditLine({
        action: 'runtime.http.denied_by_user',
        outcome: 'denied',
        resource: bridgeCandidate,
        actor: { kind: 'system', subject: 'app-shell' },
      })
      log(
        'runtime bridge outbound declined — Relay 仍会连接，但不会向 Runtime转发 task',
      )
    } else {
      allowedRuntimeBase = bridgeCandidate
      void appendHostAuditLine({
        action: 'runtime.http.consented',
        outcome: 'success',
        resource: bridgeCandidate,
        actor: { kind: 'system', subject: 'app-shell' },
      })
    }
  }

  const syncMirrorCfg: SyncMirrorConfig = {
    enabled: syncMirrorEnabledInput.checked,
    baseUrl: syncBaseUrlInput.value.trim() || DEFAULT_SYNC_BASE_URL,
  }
  if (syncMirrorCfg.enabled) {
    if (
      !(await uiConfirm(
        '允许向 sync-service 镜像关键事件？',
        `将把 task.* / audit.record / session.join* 等信封 best-effort POST 到：\n${syncMirrorCfg.baseUrl.replace(/\/$/, '')}/v1/events\n\n字段：workspaceId（信封或 default）、sessionId（信封）、source=app-shell。\n失败不影响 Relay / Runtime 主链路。`,
      ))
    ) {
      syncMirrorEnabledInput.checked = false
      try {
        localStorage.setItem('tdl:syncMirrorEnabled', '0')
      } catch {
        /* ignore */
      }
      log('sync mirror cancelled by user')
    }
  }
  const syncMirrorCfgFinal: SyncMirrorConfig = {
    enabled: syncMirrorEnabledInput.checked,
    baseUrl: syncBaseUrlInput.value.trim() || DEFAULT_SYNC_BASE_URL,
  }

  session?.disconnect()
  session = new RelayHostSession(permissionPolicy, {
    mirrorEnvelope: (m) =>
      mirrorWireEnvelopeBestEffort(syncMirrorCfgFinal, m, {
        sessionId: m.sessionId ?? session?.activeSessionId,
      }),
    onSessionJoined: (sid, ws) =>
      log(
        `session.joined: sessionId=${sid ?? '(none)'} workspaceId=${ws ?? '(none)'}`,
      ),
    onPermissionResolved: (p) =>
      log(`permission.resolved: ${p.permissionId} → ${p.decision}`),
    onRuntimeWire: async (m) => {
      log(`→ runtime wire: ${m.type}`)
      if (!allowedRuntimeBase || m.type !== 'task.submit') {
        return
      }
      try {
        const outs = await forwardEnvelopeToRuntime(allowedRuntimeBase, m)
        for (const out of outs) {
          mirrorWireEnvelopeBestEffort(syncMirrorCfgFinal, out, {
            sessionId: out.sessionId ?? session?.activeSessionId,
          })
          session?.sendToRelay(out)
        }
      } catch (e) {
        log(
          `runtime bridge failed: ${e instanceof Error ? e.message : String(e)}`,
        )
      }
    },
    onError: (e) => log(`error: ${e}`),
  })

  session
    .connect(url, { capabilities: `hostId=${hostId}` })
    .then(() => {
      setConnected(true)
      log(`connected: ${url}`)
    })
    .catch((e: unknown) => {
      log(`connect failed: ${e instanceof Error ? e.message : String(e)}`)
      setConnected(false)
    })
  })()
})

btnDisconnect.addEventListener('click', () => {
  session?.disconnect()
  session = null
  setConnected(false)
  log('disconnected')
})

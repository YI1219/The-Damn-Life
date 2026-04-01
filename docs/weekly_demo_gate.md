# Weekly Demo Gate

Pass all items before entering next phase.

## Gate Items

1. **Connection**
   - mobile can pair with host by code
   - heartbeat keeps device online
2. **Task planning**
   - command `整理下载文件夹` creates an approval-required task plan
3. **Approval**
   - rejected tasks are cancelled with audit log
   - approved tasks continue to execution
4. **Execution**
   - file organizer returns structured `moved/skipped` result
5. **Audit**
   - planned/approval/execution events are queryable
6. **Failure explainability**
   - failed execution returns reason and retry suggestion

## CLI Gate

主控进程需已监听（默认 `8787`；自动化可用 `HOST_PORT` / `HOST_WS`）。

```bash
npm run smoke:e2e
npm run smoke:e2e-success
npm run check:gate
```

`check:gate` 会先 **全量 build**，再依次：`weeklyGate`（依赖 smoke 写入的 `host/artifacts/smoke-report.json`）、**red-team**、`kernelMetricsGate`（宿主 `dist/` 体积，可用 `DAMN_LIFE_MAX_DIST_BYTES` 覆盖）、**审计链校验** `auditChainVerify`。

无 smoke 产物时（如 improver 循环）：`npm run check:gate-lite`（需已 build；仅红队 + dist 体积）。

移动端 `dist/` 体积（需先 `npm run build -w mobile`）：`npm run check:gate:mobile`。

**强制 WS 令牌模式**（独立端口启主控）：`npm run smoke:strict`。可选 `STRICT_SMOKE_CORS_ORIGIN=http://localhost:5173` 验证 CORS。

期望：全部 PASS，退出码 0。

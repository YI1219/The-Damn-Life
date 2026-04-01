# V0.5 MVP Scope Freeze

This file locks the first closed loop scope and blocks feature creep.

## In Scope

1. Connection foundation
   - pairing code lifecycle
   - WebSocket heartbeat
   - device online/offline state
2. Task pipeline V1
   - NL command to deterministic task plan
   - explicit approval before side effects
   - task state machine (`planned -> running -> succeeded|failed|cancelled`)
3. File organizer skill V1
   - classify by extension
   - move files into category folders
   - return structured result and summary
4. Audit
   - task event timeline
   - approval decision
   - side-effect summary
5. Demo gate
   - weekly script/checklist based pass-fail gate

## Out of Scope (for this cycle)

- Internet P2P and NAT traversal
- marketplace and token economy
- multi-device sync
- browser automation and extension integration (placeholder only)
- voice and vision

## Acceptance Criteria

- command `整理下载文件夹` can be planned, approved, executed, and audited end-to-end
- high-risk action runs only after approval
- failed tasks include reason and actionable suggestion

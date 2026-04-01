import { randomUUID } from "node:crypto";
import { db } from "./db.js";

const now = Date.now();
const deviceId = randomUUID();
const sessionId = randomUUID();
const taskId = randomUUID();

db.prepare("INSERT INTO devices (id, name, paired_at, last_seen_at, is_online) VALUES (?, ?, ?, ?, 1)")
  .run(deviceId, "demo-device", now, now);
db.prepare("INSERT INTO sessions (id, device_id, started_at) VALUES (?, ?, ?)")
  .run(sessionId, deviceId, now);
db.prepare("INSERT INTO tasks (id, session_id, state, type, summary, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
  .run(taskId, sessionId, "succeeded", "organize_downloads", "demo task", JSON.stringify({}), now, now);
db.prepare("INSERT INTO approvals (id, task_id, approved, reason, created_at) VALUES (?, ?, 1, ?, ?)")
  .run(randomUUID(), taskId, "demo approval", now);
db.prepare("INSERT INTO audits (id, task_id, event_type, input_summary, output_summary, side_effect_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
  .run(randomUUID(), taskId, "execution", "demo input", "demo output", JSON.stringify({ moved: 2 }), now);

console.log("Demo seed inserted.");

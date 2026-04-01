export type PlannerRound = {
  schemaVersion: 1;
  role: "planner";
  summary: string;
  targetFiles: string[];
  steps: string[];
};

export type ImplementerRound = {
  schemaVersion: 1;
  role: "implementer";
  edits: Array<{ path: string; content: string }>;
};

export type CriticRound = {
  schemaVersion: 1;
  role: "critic";
  verdict: "approve" | "revise";
  issues: string[];
  summary: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

export function parsePlannerRound(raw: unknown): PlannerRound | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (raw.schemaVersion !== 1 || raw.role !== "planner") {
    return null;
  }
  if (typeof raw.summary !== "string" || !raw.summary.trim()) {
    return null;
  }
  if (!Array.isArray(raw.targetFiles) || raw.targetFiles.length > 20) {
    return null;
  }
  if (!raw.targetFiles.every((p) => typeof p === "string" && p.trim())) {
    return null;
  }
  if (!Array.isArray(raw.steps) || raw.steps.length > 30) {
    return null;
  }
  if (!raw.steps.every((s) => typeof s === "string")) {
    return null;
  }
  return {
    schemaVersion: 1,
    role: "planner",
    summary: raw.summary,
    targetFiles: raw.targetFiles as string[],
    steps: raw.steps as string[]
  };
}

export function parseImplementerRound(raw: unknown): ImplementerRound | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (raw.schemaVersion !== 1 || raw.role !== "implementer") {
    return null;
  }
  if (!Array.isArray(raw.edits) || raw.edits.length > 25) {
    return null;
  }
  const edits: ImplementerRound["edits"] = [];
  for (const e of raw.edits) {
    if (!isRecord(e) || typeof e.path !== "string" || typeof e.content !== "string") {
      return null;
    }
    if (!e.path.trim()) {
      return null;
    }
    edits.push({ path: e.path.replace(/\\/g, "/"), content: e.content });
  }
  return { schemaVersion: 1, role: "implementer", edits };
}

export function parseCriticRound(raw: unknown): CriticRound | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (raw.schemaVersion !== 1 || raw.role !== "critic") {
    return null;
  }
  if (raw.verdict !== "approve" && raw.verdict !== "revise") {
    return null;
  }
  if (typeof raw.summary !== "string") {
    return null;
  }
  if (!Array.isArray(raw.issues) || !raw.issues.every((i) => typeof i === "string")) {
    return null;
  }
  return {
    schemaVersion: 1,
    role: "critic",
    verdict: raw.verdict,
    issues: raw.issues as string[],
    summary: raw.summary
  };
}

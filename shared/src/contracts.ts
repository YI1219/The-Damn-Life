export type TaskState = "planned" | "awaiting_approval" | "running" | "succeeded" | "failed" | "cancelled";

export type TaskPlanTaskType = "organize_downloads" | "fetch_page_text" | "cli_note_echo" | "cli_invoke";

export type TaskPlan =
  | {
      schemaVersion: 1;
      taskType: "organize_downloads";
      summary: string;
      requiresApproval: boolean;
      riskLevel: "low" | "medium" | "high";
      params: {
        targetDir: string;
        allowDelete: boolean;
      };
    }
  | {
      schemaVersion: 1;
      taskType: "fetch_page_text";
      summary: string;
      requiresApproval: boolean;
      riskLevel: "low" | "medium" | "high";
      params: {
        url: string;
        maxChars: number;
      };
    }
  | {
      schemaVersion: 1;
      taskType: "cli_note_echo";
      summary: string;
      requiresApproval: boolean;
      riskLevel: "low" | "medium" | "high";
      params: {
        message: string;
      };
    }
  | {
      schemaVersion: 1;
      taskType: "cli_invoke";
      summary: string;
      requiresApproval: boolean;
      riskLevel: "low" | "medium" | "high";
      params: {
        argv: string[];
      };
    };

export interface Device {
  id: string;
  name: string;
  pairedAt: string;
  lastSeenAt: string;
  isOnline: boolean;
}

export interface WsEnvelope<T = unknown> {
  type: string;
  payload: T;
}

export interface ApprovalDecision {
  taskId: string;
  approved: boolean;
  reason?: string;
}

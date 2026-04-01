import { mkdir, readdir, rename, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const categoryMap: Record<string, string> = {
  ".jpg": "images",
  ".jpeg": "images",
  ".png": "images",
  ".gif": "images",
  ".webp": "images",
  ".pdf": "docs",
  ".doc": "docs",
  ".docx": "docs",
  ".txt": "docs",
  ".md": "docs",
  ".zip": "archives",
  ".rar": "archives",
  ".7z": "archives",
  ".mp3": "audio",
  ".wav": "audio",
  ".mp4": "video",
  ".mov": "video"
};

export interface OrganizeResult {
  moved: Array<{ from: string; to: string }>;
  skipped: string[];
  total: number;
}

/** Read-only preview: same move mapping as execute, without mkdir/rename. */
export interface OrganizePreview {
  taskType: "organize_downloads";
  targetDir: string;
  plannedMoves: Array<{ from: string; to: string }>;
  skippedDirectories: string[];
  warnings: string[];
  totalEntries: number;
}

function getCategory(file: string): string {
  return categoryMap[extname(file).toLowerCase()] ?? "others";
}

export async function runFileOrganizer(
  targetDir: string,
  onProgress?: (progress: { processed: number; total: number; current: string }) => void
): Promise<OrganizeResult> {
  const entries = await readdir(targetDir);
  const moved: Array<{ from: string; to: string }> = [];
  const skipped: string[] = [];
  const total = entries.length;
  let processed = 0;

  for (const entry of entries) {
    const fullPath = join(targetDir, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      skipped.push(entry);
      processed += 1;
      onProgress?.({ processed, total, current: entry });
      continue;
    }
    const category = getCategory(entry);
    const targetFolder = join(targetDir, category);
    await mkdir(targetFolder, { recursive: true });
    const destination = join(targetFolder, basename(entry));
    await rename(fullPath, destination);
    moved.push({ from: fullPath, to: destination });
    processed += 1;
    onProgress?.({ processed, total, current: entry });
  }

  return { moved, skipped, total };
}

export async function previewOrganizeDownloads(targetDir: string): Promise<OrganizePreview> {
  const warnings: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(targetDir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cannot read directory";
    warnings.push(msg);
    return {
      taskType: "organize_downloads",
      targetDir,
      plannedMoves: [],
      skippedDirectories: [],
      warnings,
      totalEntries: 0
    };
  }

  const plannedMoves: Array<{ from: string; to: string }> = [];
  const skippedDirectories: string[] = [];

  for (const entry of entries) {
    const fullPath = join(targetDir, entry);
    let s: Awaited<ReturnType<typeof stat>>;
    try {
      s = await stat(fullPath);
    } catch (e) {
      warnings.push(`${entry}: ${e instanceof Error ? e.message : "stat failed"}`);
      continue;
    }
    if (s.isDirectory()) {
      skippedDirectories.push(entry);
      continue;
    }
    const category = getCategory(entry);
    const destination = join(targetDir, category, basename(entry));
    plannedMoves.push({ from: fullPath, to: destination });
  }

  return {
    taskType: "organize_downloads",
    targetDir,
    plannedMoves,
    skippedDirectories,
    warnings,
    totalEntries: entries.length
  };
}

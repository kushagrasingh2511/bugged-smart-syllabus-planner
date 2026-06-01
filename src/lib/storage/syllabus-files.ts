import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "uploads");

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export function getUploadRoot(): string {
  return UPLOAD_ROOT;
}

/** Relative path stored on Syllabus.fileUrl (from project root). */
export function buildStoredFilePath(
  userId: string,
  syllabusId: string,
  originalName: string,
): string {
  const ext = path.extname(originalName) || "";
  const base = safeSegment(path.basename(originalName, ext) || "file");
  const filename = `${base}${ext}`;
  return path.join("uploads", safeSegment(userId), safeSegment(syllabusId), filename);
}

export function resolveStoredFilePath(relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, "");
  const absolute = path.resolve(/* turbopackIgnore: true */ process.cwd(), normalized);
  const uploadRoot = path.resolve(getUploadRoot());
  if (!absolute.startsWith(uploadRoot)) {
    throw new Error("Invalid file path");
  }
  return absolute;
}

export async function saveSyllabusFile(
  userId: string,
  syllabusId: string,
  file: File,
): Promise<string> {
  const relativePath = buildStoredFilePath(userId, syllabusId, file.name || "upload");
  const absolutePath = resolveStoredFilePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return relativePath.replace(/\\/g, "/");
}

export async function readSyllabusFile(relativePath: string): Promise<Buffer> {
  const absolutePath = resolveStoredFilePath(relativePath);
  return readFile(absolutePath);
}

export function mimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}

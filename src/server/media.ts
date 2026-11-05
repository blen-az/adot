import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDir } from "@/db/client";
import { ValidationError } from "./errors";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function uploadsDir() {
  return join(dataDir(), "uploads");
}

export function sniffImage(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") {
    return "webp";
  }
  return null;
}

async function store(bytes: Buffer, extension: string) {
  await mkdir(uploadsDir(), { recursive: true });
  const fileName = `${randomUUID()}.${extension}`;
  await writeFile(join(uploadsDir(), fileName), bytes);
  return fileName;
}

export async function saveUpload(bytes: Buffer) {
  if (bytes.length > MAX_UPLOAD_BYTES) throw new ValidationError(["Images must be 5 MB or smaller"]);
  const extension = sniffImage(bytes);
  if (!extension) throw new ValidationError(["Images must be JPEG, PNG or WebP"]);
  return store(bytes, extension);
}

/** For seed placeholders only. Staff uploads go through saveUpload, which rejects SVG. */
export function saveSeedSvg(svg: string) {
  return store(Buffer.from(svg), "svg");
}

export async function readMedia(fileName: string) {
  const match = /^[0-9a-f-]{36}\.(jpg|png|webp|svg)$/.exec(fileName);
  if (!match) return null;
  try {
    return { bytes: await readFile(join(uploadsDir(), fileName)), contentType: contentTypes[match[1]] };
  } catch {
    return null;
  }
}

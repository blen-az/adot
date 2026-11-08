import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDir } from "@/db/client";
import { ValidationError } from "./errors";

// Vercel rejects function request bodies over 4.5 MB, so uploads stay under that.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

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

/** Set both on hosts without a persistent disk, such as Vercel. Unset, uploads go to DATA_DIR. */
function cloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  return cloudName && uploadPreset ? { cloudName, uploadPreset } : null;
}

async function uploadToCloudinary(
  config: { cloudName: string; uploadPreset: string },
  bytes: Buffer,
  id: string,
  extension: string,
) {
  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(bytes)], { type: contentTypes[extension] }));
  body.append("upload_preset", config.uploadPreset);
  body.append("public_id", id);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const result = (await response.json().catch(() => null)) as { public_id?: string; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(`Cloudinary upload failed: ${result?.error?.message ?? response.status}`);
  // File names are `<uuid>.<ext>`, so the preset must keep the public ID exactly as sent (no folder prefix).
  if (result?.public_id !== id) throw new Error(`Cloudinary changed the public ID to ${result?.public_id}; check the upload preset`);
}

async function store(bytes: Buffer, extension: string) {
  const id = randomUUID();
  const fileName = `${id}.${extension}`;
  const remote = cloudinary();
  if (remote) {
    await uploadToCloudinary(remote, bytes, id, extension);
    return fileName;
  }
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(join(uploadsDir(), fileName), bytes);
  return fileName;
}

export async function saveUpload(bytes: Buffer) {
  if (bytes.length > MAX_UPLOAD_BYTES) throw new ValidationError(["Images must be 4 MB or smaller"]);
  const extension = sniffImage(bytes);
  if (!extension) throw new ValidationError(["Images must be JPEG, PNG or WebP"]);
  return store(bytes, extension);
}

/** For seed placeholders only. Staff uploads go through saveUpload, which rejects SVG. */
export function saveSeedSvg(svg: string) {
  return store(Buffer.from(svg), "svg");
}

const mediaName = /^[0-9a-f-]{36}\.(jpg|png|webp|svg)$/;

/** Where to send the browser when media lives on Cloudinary; null when it is served from disk. */
export function remoteMediaUrl(fileName: string) {
  const remote = cloudinary();
  if (!remote || !mediaName.test(fileName)) return null;
  return `https://res.cloudinary.com/${remote.cloudName}/image/upload/${fileName}`;
}

export async function readMedia(fileName: string) {
  const match = mediaName.exec(fileName);
  if (!match) return null;
  try {
    return { bytes: await readFile(join(uploadsDir(), fileName)), contentType: contentTypes[match[1]] };
  } catch {
    return null;
  }
}

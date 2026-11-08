"use client";

import { ImageUpIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

// Mirrors MAX_UPLOAD_BYTES in src/server/media.ts. The server check is the real one; this saves a wasted upload.
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** File picker with a live preview. The server still validates size and file type. */
export function ImageUploadField({ id, current, currentAlt = "" }: { id: string; current?: string; currentAlt?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setPreview(null);
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 4 MB.`);
      event.target.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  const shown = preview ?? current;
  return (
    <div className="upload-field">
      <label className="upload-drop" htmlFor={id} data-has-image={shown ? "" : undefined}>
        {shown ? (
          <img src={shown} alt={preview ? "Preview of the selected image" : currentAlt} />
        ) : (
          <ImageUpIcon aria-hidden="true" />
        )}
        <span className="upload-drop-text">
          <strong>{preview ? "Choose a different image" : current ? "Choose a replacement" : "Choose an image"}</strong>
          <span>JPEG, PNG or WebP, up to 4 MB</span>
        </span>
      </label>
      <input
        id={id}
        name="file"
        type="file"
        className="sr-only"
        accept={TYPES.join(",")}
        required
        onChange={onChange}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function UploadButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending && <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />}
      {pending ? "Uploading…" : children}
    </Button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { ErrorInline } from "@/components/states/ErrorInline";
import { Button } from "@/components/ui/button";
import { createMediaRecord } from "@/lib/products/actions";
import {
  fileExtension,
  MAX_IMAGE_BYTES,
  MAX_MODEL_BYTES,
  nearestAspect,
  STORE_MEDIA_BUCKET,
  storagePathFor,
  type MediaAspect,
} from "@/lib/products/media";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Media upload path (spec S8, STEP 3). Files stream browser → the
 * `store-media` bucket on the anon-key client (RLS-scoped), then a server
 * action registers the `media` row. Upload states are per-file and inline:
 * a failure is a quiet error + retry on THAT file — everything already
 * uploaded is retained, staged files keep their alt/focal edits.
 *
 * Order is upload order: rows are committed sequentially, so the ledger's
 * created_at sequence (server-stamped, MIG-TS) carries the seller's chosen
 * order. World composition binds imagery to pieces (D4, renderer-owned);
 * this uploader fills the store's library.
 */

type StagedStatus = "staged" | "uploading" | "saving" | "done" | "error";

type StagedImage = {
  key: string;
  file: File;
  previewUrl: string;
  alt: string;
  focal: { x: number; y: number };
  aspect: MediaAspect;
  status: StagedStatus;
  error?: string;
  /** Set once the storage upload succeeds — a retry then skips re-upload. */
  uploadedPath?: string;
  mediaId?: string;
};

const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-4 py-2.5 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const labelClass =
  "font-text text-caption uppercase tracking-[0.08em] text-muted";

const STATUS_LABEL: Record<StagedStatus, string> = {
  staged: "Ready to upload",
  uploading: "Uploading…",
  saving: "Saving to your library…",
  done: "In your library",
  error: "Upload failed",
};

function humanUploadError(message: string): string {
  return /bucket/i.test(message)
    ? "The store-media space isn't provisioned yet — your images are kept here, try again once it is."
    : "That upload didn't make it — try again.";
}

async function loadAspect(file: File, url: string): Promise<MediaAspect> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(nearestAspect(img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve("1:1");
    img.src = url;
  });
}

export function ImageUploader({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<StagedImage[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Object URLs are revoked on unmount only — a staged file's preview must
  // survive re-renders and failed uploads (prior media retained).
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  function patch(key: string, changes: Partial<StagedImage>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const additions: StagedImage[] = [];
    for (const file of Array.from(files)) {
      const key = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const tooBig = file.size > MAX_IMAGE_BYTES;
      const badExt = storagePathFor(storeId, "image", file.name) === null;
      additions.push({
        key,
        file,
        previewUrl,
        alt: "",
        focal: { x: 0.5, y: 0.5 },
        aspect: await loadAspect(file, previewUrl),
        status: tooBig || badExt ? "error" : "staged",
        error: tooBig
          ? "That file is over 10 MB — export a smaller version."
          : badExt
            ? `Images are ${["jpg", "jpeg", "png", "webp", "avif"].join(", ")} — that file isn't one.`
            : undefined,
      });
    }
    setItems((prev) => [...prev, ...additions]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function move(key: string, direction: -1 | 1) {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const moved = next[index];
      const displaced = next[target];
      if (!moved || !displaced) return prev;
      next[index] = displaced;
      next[target] = moved;
      return next;
    });
  }

  function remove(key: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item && item.status !== "done") URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.key !== key);
    });
  }

  /** Uploads ONE item: storage first (skipped on row-retry), then the row. */
  async function uploadItem(item: StagedImage): Promise<boolean> {
    const supabase = createClient();
    let path = item.uploadedPath ?? null;

    if (!path) {
      const candidate = storagePathFor(storeId, "image", item.file.name);
      if (!candidate) return false;
      patch(item.key, { status: "uploading", error: undefined });
      const { error } = await supabase.storage
        .from(STORE_MEDIA_BUCKET)
        .upload(candidate, item.file, {
          contentType: item.file.type || undefined,
          upsert: false,
        });
      if (error) {
        patch(item.key, { status: "error", error: humanUploadError(error.message) });
        return false;
      }
      path = candidate;
      patch(item.key, { uploadedPath: candidate });
    }

    patch(item.key, { status: "saving", error: undefined });
    const result = await createMediaRecord({
      kind: "image",
      path,
      alt: item.alt,
      aspect: item.aspect,
      focalPoint: item.focal,
      mime: item.file.type || "",
    });
    if (result.status === "error") {
      patch(item.key, { status: "error", error: result.message });
      return false;
    }
    patch(item.key, { status: "done", mediaId: result.mediaId });
    return true;
  }

  /** Sequential batch — order of the list IS the stored order. */
  async function uploadAll() {
    setBatchRunning(true);
    try {
      for (const item of itemsRef.current) {
        if (item.status === "done") continue;
        if (item.status === "error" && !item.uploadedPath && item.error?.includes("MB")) {
          continue; // size/type rejects need a different file, not a retry
        }
        const current = itemsRef.current.find((i) => i.key === item.key);
        if (!current) continue;
        const ok = await uploadItem(current);
        if (!ok) break; // stop so order holds; completed uploads are retained
      }
    } finally {
      setBatchRunning(false);
    }
  }

  const pendingCount = items.filter((i) => i.status !== "done").length;
  const doneCount = items.length - pendingCount;
  const missingAlt = items.some((i) => i.status !== "done" && i.alt.trim() === "");
  const uploading = items.find(
    (i) => i.status === "uploading" || i.status === "saving",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-2">
        <label htmlFor="image-file-input" className={labelClass}>
          Add images
        </label>
        <input
          ref={fileInputRef}
          id="image-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => void addFiles(e.target.files)}
          className="min-h-11 w-full cursor-pointer rounded-md border border-dashed border-line bg-surface/60 px-4 py-2.5 text-body text-muted file:mr-4 file:cursor-pointer file:rounded-pill file:border file:border-line file:bg-surface file:px-4 file:py-1.5 file:font-text file:text-caption file:uppercase file:tracking-[0.04em] file:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <p className="text-caption text-muted">
          They join your store&rsquo;s library in this order; your world
          composition places them with the piece. jpg, png, webp or avif, up
          to 10 MB each.
        </p>
      </div>

      {items.length > 0 ? (
        <ol className="flex flex-col gap-4">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 sm:flex-row"
            >
              <div className="relative w-full shrink-0 overflow-hidden rounded-sm bg-ground sm:w-40">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                <img
                  src={item.previewUrl}
                  alt={item.alt || "Staged upload preview"}
                  className="aspect-square h-auto w-full object-cover"
                  style={{
                    objectPosition: `${item.focal.x * 100}% ${item.focal.y * 100}%`,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-surface bg-accent"
                  style={{
                    left: `${item.focal.x * 100}%`,
                    top: `${item.focal.y * 100}%`,
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-caption uppercase tracking-[0.04em] text-muted">
                    {index + 1} · {item.aspect}
                    {" · "}
                    <span role="status">{STATUS_LABEL[item.status]}</span>
                  </span>
                  <span className="flex gap-1">
                    <IconButton
                      label={`Move image ${index + 1} earlier`}
                      disabled={index === 0 || item.status === "done"}
                      onClick={() => move(item.key, -1)}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label={`Move image ${index + 1} later`}
                      disabled={index === items.length - 1 || item.status === "done"}
                      onClick={() => move(item.key, 1)}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      label={`Remove image ${index + 1}`}
                      disabled={item.status === "uploading" || item.status === "saving"}
                      onClick={() => remove(item.key)}
                    >
                      ×
                    </IconButton>
                  </span>
                </div>

                {item.status !== "done" ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`alt-${item.key}`} className={labelClass}>
                        Alt text <span className="normal-case tracking-normal">(required)</span>
                      </label>
                      <input
                        id={`alt-${item.key}`}
                        type="text"
                        maxLength={300}
                        value={item.alt}
                        onChange={(e) => patch(item.key, { alt: e.target.value })}
                        placeholder="What would a buyer see here?"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FocalSlider
                        id={`focal-x-${item.key}`}
                        label="Focus left–right"
                        value={item.focal.x}
                        onChange={(x) =>
                          patch(item.key, { focal: { ...item.focal, x } })
                        }
                      />
                      <FocalSlider
                        id={`focal-y-${item.key}`}
                        label="Focus top–bottom"
                        value={item.focal.y}
                        onChange={(y) =>
                          patch(item.key, { focal: { ...item.focal, y } })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-body text-muted">
                    {item.alt} — in your library.
                  </p>
                )}

                {item.status === "error" && item.error ? (
                  <ErrorInline
                    message={item.error}
                    onRetry={
                      item.error.includes("MB") || item.error.includes("isn't one")
                        ? undefined
                        : () => void uploadItem(item)
                    }
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {items.length > 0 && pendingCount > 0 ? (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="quiet"
            disabled={batchRunning || missingAlt}
            onClick={() => void uploadAll()}
            title={missingAlt ? "Every image needs alt text first" : undefined}
          >
            {batchRunning
              ? `Uploading ${doneCount + 1} of ${items.length}…`
              : `Upload ${pendingCount} image${pendingCount === 1 ? "" : "s"}`}
          </Button>
          {missingAlt ? (
            <p className="text-caption text-muted">
              Every image needs alt text before it uploads — it&rsquo;s how
              buyers without sight meet your work.
            </p>
          ) : null}
          {uploading ? (
            <p className="sr-only" role="status">
              {STATUS_LABEL[uploading.status]}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Optional 3D model (.glb/.gltf). One file; on success the media id lands in
 * the product form's model3d binding. Absence is fine — the product page
 * falls back to the gallery (block-catalog §4).
 */
export function ModelUploader({
  storeId,
  value,
  onChange,
}: {
  storeId: string;
  value: string;
  onChange: (mediaId: string) => void;
}) {
  const [staged, setStaged] = useState<File | null>(null);
  const [status, setStatus] = useState<StagedStatus>("staged");
  const [error, setError] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const supabase = createClient();
    let path = uploadedPath;

    if (!path) {
      const candidate = storagePathFor(storeId, "model3d", file.name);
      if (!candidate) {
        setStatus("error");
        setError("3D models are .glb or .gltf files.");
        return;
      }
      if (file.size > MAX_MODEL_BYTES) {
        setStatus("error");
        setError("That model is over 50 MB — compress it first.");
        return;
      }
      setStatus("uploading");
      setError(null);
      const { error: uploadError } = await supabase.storage
        .from(STORE_MEDIA_BUCKET)
        .upload(candidate, file, {
          contentType: file.type || "model/gltf-binary",
          upsert: false,
        });
      if (uploadError) {
        setStatus("error");
        setError(humanUploadError(uploadError.message));
        return;
      }
      path = candidate;
      setUploadedPath(candidate);
    }

    setStatus("saving");
    const result = await createMediaRecord({
      kind: "model3d",
      path,
      mime: file.type || "model/gltf-binary",
    });
    if (result.status === "error") {
      setStatus("error");
      setError(result.message);
      return;
    }
    setStatus("done");
    onChange(result.mediaId);
  }

  function clear() {
    setStaged(null);
    setStatus("staged");
    setError(null);
    setUploadedPath(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      {value && status !== "uploading" && status !== "saving" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-body text-ink">
            {status === "done" && staged
              ? `${staged.name} — attached.`
              : "A 3D model is attached."}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Remove
          </Button>
        </div>
      ) : (
        <>
          <label htmlFor="model-file-input" className={labelClass}>
            3D model <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            ref={inputRef}
            id="model-file-input"
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setStaged(file);
              setStatus("staged");
              setError(null);
              setUploadedPath(null);
              if (file) void upload(file);
            }}
            className="min-h-11 w-full cursor-pointer rounded-md border border-dashed border-line bg-surface/60 px-4 py-2.5 text-body text-muted file:mr-4 file:cursor-pointer file:rounded-pill file:border file:border-line file:bg-surface file:px-4 file:py-1.5 file:font-text file:text-caption file:uppercase file:tracking-[0.04em] file:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <p className="text-caption text-muted">
            Buyers can turn the piece in their hands. Without one, the gallery
            carries the page — nothing breaks.
          </p>
          {(status === "uploading" || status === "saving") && staged ? (
            <p role="status" className={cn("text-body text-muted", "tabular-nums")}>
              {status === "uploading"
                ? `Uploading ${staged.name}…`
                : "Saving to your library…"}
            </p>
          ) : null}
          {status === "error" && error ? (
            <ErrorInline
              message={error}
              onRetry={
                staged && !error.includes("MB") && !error.includes(".glb")
                  ? () => staged && void upload(staged)
                  : undefined
              }
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-body text-ink transition-colors duration-state ease-kol hover:bg-ground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function FocalSlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="min-h-11 w-full cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
}

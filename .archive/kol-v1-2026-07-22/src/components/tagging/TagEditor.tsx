"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { EmptyPrompt } from "@/components/states/EmptyPrompt";
import { ErrorInline } from "@/components/states/ErrorInline";
import { Button } from "@/components/ui/button";
import {
  saveVideoProfile,
  type SaveVideoProfileResult,
  type TagField,
} from "@/lib/tagging/actions";
import {
  MOOD,
  PAGE_ELIGIBILITY,
  PURPOSE,
  THANKYOU_ONLY_MESSAGE,
  violatesThankyouOnly,
  type Mood,
  type PageEligibility,
  type Purpose,
  type TagSuggestion,
  type VideoProfileWrite,
} from "@/lib/tagging/schemas";

/**
 * Seller tagging surface (spec P7, all 4 states):
 *   empty   → untagged clip; "tag this clip — untagged clips won't appear"
 *   loading → AI suggestion in flight / save in flight, actions disabled
 *   error   → inline, quiet, recoverable — always falls back to manual
 *   success → confirmed tags saved; the clip is engine-eligible
 *
 * CONFIRM-BEFORE-PUBLISH: an AI suggestion is a draft. "Use these tags" only
 * fills the form; nothing reaches `video_profiles` until the seller presses
 * save, and that write re-validates through videoProfileWriteSchema (the
 * trust boundary — see lib/tagging/schemas.ts). No suggestion is ever
 * auto-applied.
 */

export type ProductOption = { id: string; title: string };

/**
 * What the editor needs back from any suggest action. Every failure mode
 * (429 retries exhausted, 529 overload, malformed output) collapses to
 * "unavailable" here on purpose — the seller's recovery is identical in all
 * of them: tag manually. The cost log keeps the diagnostic distinctions.
 */
export type SuggestTagsResult =
  | { status: "ok"; suggestion: TagSuggestion }
  | { status: "unavailable"; message: string };

export type SuggestTagsAction = (videoId: string) => Promise<SuggestTagsResult>;

type SuggestUiState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; suggestion: TagSuggestion }
  | { phase: "applied" }
  | { phase: "unavailable"; message: string };

/** Below this the whole suggestion is flagged for a closer look. */
const LOW_CONFIDENCE = 0.6;

const labelClass =
  "font-text text-caption uppercase tracking-[0.08em] text-muted";

const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-4 py-2.5 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function toggled<T extends string>(list: readonly T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function TagCheckboxGroup<T extends string>({
  legend,
  hint,
  options,
  selected,
  onToggle,
  error,
  disabled,
}: {
  legend: string;
  hint: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  error?: string;
  disabled: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className={labelClass}>{legend}</legend>
      <p className="text-body text-muted">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isOn = selected.includes(option);
          return (
            <label
              key={option}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-4 py-2 font-text text-body transition-colors duration-state ease-kol ${
                isOn
                  ? "border-accent bg-ground text-ink"
                  : "border-line bg-surface text-muted hover:bg-ground"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isOn}
                onChange={() => onToggle(option)}
              />
              {option}
            </label>
          );
        })}
      </div>
      {error ? <ErrorInline message={error} /> : null}
    </fieldset>
  );
}

function SuggestionTagLine({
  label,
  values,
}: {
  label: string;
  values: readonly string[];
}) {
  return (
    <p className="text-body text-ink">
      <span className={labelClass}>{label} </span>
      {values.length > 0 ? values.join(" · ") : "none"}
    </p>
  );
}

export function TagEditor({
  videoId,
  initial,
  products,
  suggest,
}: {
  videoId: string;
  /** The clip's saved profile, already schema-parsed by the page (or null). */
  initial: VideoProfileWrite | null;
  /** The clip's store's products (RLS-scoped read in the page). */
  products: ProductOption[];
  /** AI suggest action — when absent the editor is manual-only. */
  suggest?: SuggestTagsAction;
}) {
  const [purpose, setPurpose] = useState<Purpose[]>(initial?.purpose ?? []);
  const [pages, setPages] = useState<PageEligibility[]>(
    initial?.page_eligibility ?? [],
  );
  const [mood, setMood] = useState<Mood[]>(initial?.mood ?? []);
  const [productLinks, setProductLinks] = useState<string[]>(
    initial?.product_links ?? [],
  );
  const [antiKey, setAntiKey] = useState(initial?.anti_repetition_key ?? "");

  const [saveState, setSaveState] = useState<
    SaveVideoProfileResult | { status: "idle" }
  >({ status: "idle" });
  const [suggestState, setSuggestState] = useState<SuggestUiState>({
    phase: "idle",
  });
  const [fromSuggestion, setFromSuggestion] = useState(false);
  const [saving, startSaving] = useTransition();
  const [suggesting, startSuggesting] = useTransition();

  const wasUntagged =
    initial === null ||
    (initial.purpose.length === 0 &&
      initial.page_eligibility.length === 0 &&
      initial.mood.length === 0 &&
      initial.product_links.length === 0);
  const savedOnce = saveState.status === "saved";

  const thankyouInvalid = violatesThankyouOnly({
    purpose,
    page_eligibility: pages,
  });
  const busy = saving || suggesting;

  const fieldError = (field: TagField): string | undefined =>
    saveState.status === "error" ? saveState.fieldErrors?.[field] : undefined;

  const handleSave = () => {
    startSaving(async () => {
      const result = await saveVideoProfile(videoId, {
        purpose,
        page_eligibility: pages,
        product_links: productLinks,
        mood,
        anti_repetition_key: antiKey,
      });
      setSaveState(result);
      if (result.status === "saved") setFromSuggestion(false);
    });
  };

  const handleSuggest = () => {
    if (!suggest) return;
    setSuggestState({ phase: "loading" });
    startSuggesting(async () => {
      const result = await suggest(videoId);
      setSuggestState(
        result.status === "ok"
          ? { phase: "ready", suggestion: result.suggestion }
          : { phase: "unavailable", message: result.message },
      );
    });
  };

  const applySuggestion = (suggestion: TagSuggestion) => {
    const known = new Set(products.map((p) => p.id));
    setPurpose(suggestion.purpose);
    setPages(suggestion.page_eligibility);
    setMood(suggestion.mood);
    // A suggested link outside this store's products is a hallucination —
    // drop it here; the engine's dangling-id fallback never even sees it.
    setProductLinks(suggestion.product_links.filter((id) => known.has(id)));
    setAntiKey(suggestion.anti_repetition_key ?? "");
    setSuggestState({ phase: "applied" });
    setFromSuggestion(true);
    setSaveState({ status: "idle" });
  };

  const productTitle = (id: string) =>
    products.find((p) => p.id === id)?.title ?? "unknown product";

  return (
    <div className="flex flex-col gap-6">
      {wasUntagged && !savedOnce ? (
        // ── Empty state: untagged = invisible to the engine ──
        <EmptyPrompt
          prompt="Tag this clip"
          hint="Untagged clips won't appear anywhere — a few tags make this film part of your world."
        />
      ) : null}

      {suggest ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={handleSuggest}
              disabled={busy}
              aria-busy={suggesting || undefined}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {suggesting ? "Reading the clip…" : "Suggest tags with AI"}
            </Button>
            {suggesting ? (
              <p className="text-body text-muted" role="status">
                Watching your film for you — a few seconds.
              </p>
            ) : null}
          </div>

          {suggestState.phase === "unavailable" ? (
            <ErrorInline
              message={suggestState.message}
              onRetry={handleSuggest}
            />
          ) : null}

          {suggestState.phase === "ready" ? (
            <div
              className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-6 py-5"
              role="region"
              aria-label="AI tag suggestion"
            >
              <p className="font-display text-h3 text-ink">Suggested tags</p>
              <SuggestionTagLine
                label="purpose"
                values={suggestState.suggestion.purpose}
              />
              <SuggestionTagLine
                label="pages"
                values={suggestState.suggestion.page_eligibility}
              />
              <SuggestionTagLine
                label="mood"
                values={suggestState.suggestion.mood}
              />
              <SuggestionTagLine
                label="products"
                values={suggestState.suggestion.product_links.map(productTitle)}
              />
              <SuggestionTagLine
                label="repetition key"
                values={
                  suggestState.suggestion.anti_repetition_key
                    ? [suggestState.suggestion.anti_repetition_key]
                    : []
                }
              />
              <p className="text-body text-muted">
                Confidence{" "}
                {Math.round(suggestState.suggestion.confidence * 100)}%
                {suggestState.suggestion.confidence < LOW_CONFIDENCE
                  ? " — low. Double-check these before using them."
                  : null}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => applySuggestion(suggestState.suggestion)}
                >
                  Use these tags
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSuggestState({ phase: "idle" })}
                >
                  Dismiss
                </Button>
              </div>
              <p className="text-body text-muted">
                Nothing is saved until you confirm below — these are yours to
                edit.
              </p>
            </div>
          ) : null}

          {suggestState.phase === "applied" ? (
            <p className="text-body text-muted" role="status">
              Suggestion applied to the form — review, edit, then confirm.
            </p>
          ) : null}
        </div>
      ) : null}

      <TagCheckboxGroup
        legend="Purpose"
        hint="What this clip is — what a visitor is watching."
        options={PURPOSE}
        selected={purpose}
        onToggle={(v) => setPurpose((prev) => toggled(prev, v))}
        error={fieldError("purpose")}
        disabled={busy}
      />

      <TagCheckboxGroup
        legend="Pages"
        hint="Where this clip may appear. No pages selected means it appears nowhere."
        options={PAGE_ELIGIBILITY}
        selected={pages}
        onToggle={(v) => setPages((prev) => toggled(prev, v))}
        error={fieldError("page_eligibility")}
        disabled={busy}
      />

      <TagCheckboxGroup
        legend="Mood"
        hint="How the clip feels."
        options={MOOD}
        selected={mood}
        onToggle={(v) => setMood((prev) => toggled(prev, v))}
        error={fieldError("mood")}
        disabled={busy}
      />

      <fieldset className="flex flex-col gap-2" disabled={busy}>
        <legend className={labelClass}>Products in this clip</legend>
        <p className="text-body text-muted">
          Link the products this film narrates or shows.
        </p>
        {products.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {products.map((product) => {
              const isOn = productLinks.includes(product.id);
              return (
                <label
                  key={product.id}
                  className={`inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-4 py-2 font-text text-body transition-colors duration-state ease-kol ${
                    isOn
                      ? "border-accent bg-ground text-ink"
                      : "border-line bg-surface text-muted hover:bg-ground"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isOn}
                    onChange={() =>
                      setProductLinks((prev) => toggled(prev, product.id))
                    }
                  />
                  {product.title}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-body text-muted">
            No products in this store yet — once you add some, you can link
            them here.
          </p>
        )}
        {fieldError("product_links") ? (
          <ErrorInline message={fieldError("product_links") ?? ""} />
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="tag-anti-repetition-key" className={labelClass}>
          Repetition key{" "}
          <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <p className="text-body text-muted">
          Clips sharing a key won&apos;t repeat in one visit — lowercase words
          joined by hyphens, e.g. sena-wheel.
        </p>
        <input
          id="tag-anti-repetition-key"
          type="text"
          maxLength={64}
          value={antiKey}
          onChange={(e) => setAntiKey(e.target.value)}
          placeholder="sena-wheel"
          disabled={busy}
          aria-invalid={fieldError("anti_repetition_key") ? true : undefined}
          className={`${inputClass} max-w-xs`}
        />
        {fieldError("anti_repetition_key") ? (
          <ErrorInline message={fieldError("anti_repetition_key") ?? ""} />
        ) : null}
      </div>

      {thankyouInvalid ? (
        <ErrorInline message={THANKYOU_ONLY_MESSAGE} />
      ) : null}

      {saveState.status === "error" && !saveState.fieldErrors ? (
        <ErrorInline message={saveState.message} onRetry={handleSave} />
      ) : null}

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="accent"
          onClick={handleSave}
          disabled={busy || thankyouInvalid}
          aria-busy={saving || undefined}
        >
          {saving
            ? "Saving…"
            : fromSuggestion
              ? "Confirm & save tags"
              : "Save tags"}
        </Button>
        {saveState.status === "saved" && !saving ? (
          <p className="text-body text-muted" role="status">
            {pages.length > 0
              ? `Saved — this clip can now appear on: ${pages.join(", ")}.`
              : "Saved — no pages selected, so this clip stays hidden for now."}
          </p>
        ) : null}
        {saving ? (
          <p className="sr-only" role="status">
            Saving tags
          </p>
        ) : null}
      </div>
    </div>
  );
}

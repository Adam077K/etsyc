"use client";

import Image from "next/image";
import { SpeakerHigh, Play, Lock } from "@phosphor-icons/react";
import { COVER_MAKER } from "@/lib/fixtures/makers";
import { WORLDS } from "@/lib/fixtures/worlds";
import { cn } from "@/lib/utils";

/**
 * The studio PREVIEW PANE — the one place a maker's own brand appears (D15). It
 * renders the AI-drafted Odd Clay world from data, recoloured live by the accent
 * the maker picks and reshaped by their block swaps. Each section is selectable,
 * so clicking the preview drives the editor. Everything outside this frame is
 * KOL's fixed chrome.
 */

function loadOddClay() {
  const w = WORLDS["odd-clay"];
  if (!w) throw new Error("sell-preview: missing 'odd-clay' world fixture");
  return w;
}
const world = loadOddClay();
const maker = COVER_MAKER;

export interface PreviewState {
  accentHex: string;
  /** "light" = light text sits on the accent (dark ground); "dark" = the reverse */
  accentOn: "light" | "dark";
  variants: Record<string, string>;
  voiceovers: Set<string>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function SellPreview(state: PreviewState) {
  const { selectedId, onSelect } = state;
  const textOnAccent = state.accentOn === "light" ? "#EFE6D6" : "#1C1613";

  const sectionCls = (id: string) =>
    cn(
      "relative block w-full text-left transition-all focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-inset",
      selectedId === id
        ? "ring-2 ring-inset ring-marigold"
        : "ring-0 hover:ring-2 hover:ring-inset hover:ring-marigold/40",
    );

  return (
    <div className="overflow-hidden rounded-2xl bg-ink">
      {/* Hero */}
      <button
        type="button"
        onClick={() => onSelect("hero")}
        aria-label="Edit cover film"
        className={sectionCls("hero")}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={maker.image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 40rem"
            className={cn(
              "object-cover",
              state.variants.hero === "portrait" && "object-top",
            )}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${hexA("#1C1613", 0.92)}, ${hexA(state.accentHex, 0.25)} 55%, transparent)`,
            }}
          />
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">
            <Play size={11} weight="fill" style={{ color: state.accentHex }} />
            <span className="meta text-[0.6rem] text-bone">
              {state.variants.hero === "portrait" ? "Portrait cover" : "Now playing · 1:12"}
            </span>
          </span>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p
              className="mb-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em]"
              style={{ color: lightAccent(state.accentHex) }}
            >
              {maker.discipline}
            </p>
            <p
              className="font-display font-extrabold leading-[0.92] text-bone"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
            >
              {maker.studio}
            </p>
            <p className="mt-1.5 font-serif text-base italic text-bone/90">
              {world.tagline}
            </p>
            <VoiceTag show={state.voiceovers.has("hero::The welcome line")} />
          </div>
        </div>
      </button>

      {/* Story */}
      <button
        type="button"
        onClick={() => onSelect("story")}
        aria-label="Edit your story"
        className={cn(sectionCls("story"), "bg-ink")}
      >
        <div
          className={cn(
            "grid gap-4 p-5",
            state.variants.story === "stacked" ? "grid-cols-1" : "grid-cols-[1.1fr_1fr]",
          )}
        >
          <div className="flex flex-col justify-center">
            <p
              className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.16em]"
              style={{ color: lightAccent(state.accentHex) }}
            >
              The maker
            </p>
            <p className="font-serif text-[0.95rem] leading-relaxed text-bone/90">
              {world.story[0]}
            </p>
            <VoiceTag show={state.voiceovers.has("story::Paragraph one")} />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl ring-1 ring-line">
            <Image
              src={world.storyImage}
              alt=""
              fill
              sizes="20rem"
              className="object-cover"
            />
          </div>
        </div>
      </button>

      {/* Process */}
      <button
        type="button"
        onClick={() => onSelect("process")}
        aria-label="Edit how it's made"
        className={cn(sectionCls("process"), "bg-ink")}
      >
        <div className="p-5">
          <p
            className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]"
            style={{ color: lightAccent(state.accentHex) }}
          >
            How it&#39;s made
          </p>
          <p className="mb-3 font-display text-lg font-bold text-bone">
            {world.processSectionHeader}
          </p>
          <div
            className={cn(
              "gap-2.5",
              state.variants.process === "filmstrip"
                ? "flex overflow-x-auto"
                : "grid grid-cols-3",
            )}
          >
            {world.process.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "overflow-hidden rounded-lg bg-ink-soft ring-1 ring-line",
                  state.variants.process === "filmstrip" && "w-32 shrink-0",
                )}
              >
                <div className="relative aspect-[4/3]">
                  <Image src={s.image} alt="" fill sizes="12rem" className="object-cover" />
                  <span className="meta absolute left-1.5 top-1.5 text-[0.55rem] text-bone/80">
                    {s.label}
                  </span>
                </div>
                <p className="px-2 py-1.5 font-ui text-[0.7rem] font-semibold text-bone">
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </button>

      {/* Shop — carries the empty state when hidden */}
      <button
        type="button"
        onClick={() => onSelect("shop")}
        aria-label="Edit the shop"
        className={cn(sectionCls("shop"), "bg-ink")}
      >
        <div className="p-5">
          <p
            className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]"
            style={{ color: lightAccent(state.accentHex) }}
          >
            The work
          </p>
          <p className="mb-3 font-display text-lg font-bold text-bone">
            {world.shopSectionHeader}
          </p>

          {state.variants.shop === "hidden" ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-5 py-10 text-center">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-ink-raise">
                <Lock size={20} style={{ color: state.accentHex }} />
              </span>
              <p className="font-ui text-sm font-semibold text-bone">
                The shop is hidden for now
              </p>
              <p className="mt-1 max-w-xs font-ui text-xs text-bone/55">
                Your story is still live. Turn the shop on from the panel whenever
                you&#39;re ready to sell.
              </p>
            </div>
          ) : state.variants.shop === "quiet" ? (
            <div className="grid grid-cols-3 gap-2.5">
              {world.products.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-lg bg-ink-soft ring-1 ring-line">
                  <div className="relative aspect-square">
                    <Image src={p.image} alt="" fill sizes="10rem" className="object-cover" />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="truncate font-ui text-[0.7rem] font-semibold text-bone">{p.name}</p>
                    <p className="font-display text-xs font-bold" style={{ color: lightAccent(state.accentHex) }}>
                      {p.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {world.products.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    "grid grid-cols-[1fr_1.2fr] overflow-hidden rounded-lg bg-ink-soft ring-1 ring-line",
                    i % 2 === 1 && "[&>*:first-child]:order-2",
                  )}
                >
                  <div className="relative aspect-[4/3]">
                    <Image src={p.image} alt="" fill sizes="14rem" className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-1 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display text-sm font-bold text-bone">{p.name}</p>
                      <p className="font-display text-sm font-bold" style={{ color: lightAccent(state.accentHex) }}>
                        {p.price}
                      </p>
                    </div>
                    <p className="font-serif text-xs italic leading-snug text-bone/70">
                      {p.blurb}
                    </p>
                    <VoiceTag show={state.voiceovers.has(`shop::${p.name}`)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Studio — accent ground */}
      <button
        type="button"
        onClick={() => onSelect("studio")}
        aria-label="Edit the studio"
        className={sectionCls("studio")}
        style={{ backgroundColor: state.accentHex }}
      >
        <div
          className={cn(
            "gap-2 p-2",
            state.variants.studio === "pair" ? "grid grid-cols-2" : "block",
          )}
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src={world.studioImage}
              alt=""
              fill
              sizes="40rem"
              className="object-cover opacity-90 mix-blend-multiply"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" />
            <p className="meta absolute bottom-2 left-3 text-[0.6rem] text-bone">
              {world.studioCaption}
            </p>
          </div>
          {state.variants.studio === "pair" && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={world.process[0]!.image}
                alt=""
                fill
                sizes="20rem"
                className="object-cover opacity-90 mix-blend-multiply"
              />
            </div>
          )}
        </div>
        <div className="px-3 pb-2">
          <VoiceTag show={state.voiceovers.has("studio::The studio caption")} />
        </div>
      </button>

      {/* Voice — accent drenched close */}
      <button
        type="button"
        onClick={() => onSelect("voice")}
        aria-label="Edit the closing line"
        className={sectionCls("voice")}
        style={{ backgroundColor: state.accentHex }}
      >
        <div className="px-6 py-9 text-center">
          <p
            className="mx-auto max-w-sm font-serif leading-[1.2]"
            style={{ color: textOnAccent, fontSize: "clamp(1.5rem, 2.5vw, 1.6rem)" }}
          >
            {world.voice}
          </p>
          {state.variants.voice === "follow" && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-4 py-1.5 font-ui text-xs font-semibold text-bone backdrop-blur-sm">
              Follow {maker.studio}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

/* A KOL-tooling tag (solid ink chip) so it stays legible on any ground and
   reads as chrome, not the maker's brand — sharpens the D15 boundary. */
function VoiceTag({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 font-ui text-[0.6rem] font-medium text-bone backdrop-blur-sm">
      <SpeakerHigh size={11} weight="fill" className="text-marigold" />
      Tap to hear
    </span>
  );
}

/* Lighten an accent for small legible text on ink (keeps it readable at AA). */
function lightAccent(hex: string): string {
  const map: Record<string, string> = {
    "#7C2D12": "#E08462", // clay -> AA tint
    "#4C2740": "#C79ABE", // plum -> soft mauve
    "#4E5A2A": "#A8B673", // olive -> pale olive
    "#41628C": "#7FA6C8", // sky -> AA tint
    "#EFE6D6": "#EFE6D6", // bone stays
  };
  return map[hex] ?? "#F1641E";
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

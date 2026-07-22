# Ship-blocker fix — the `--muted` AA failure

*Design-Lead · 2026-07-21. Closes the deferred Wave-0 item: "P2-a: sunbaked page-muted token 3.62:1 (EmptyPrompt/ErrorInline) → P8/design-system → MUST clear" ([FULL-MVP-BUILD-LAUNCH-PROMPT](../08-agents_work/handoffs/2026-07-21-FULL-MVP-BUILD-LAUNCH-PROMPT.md) line 128; [qa-lead-kol-p5-final](../08-agents_work/sessions/2026-07-21-qa-lead-kol-p5-final.md)).*

**Verdict: the ticket names the wrong culprit, and the named fix would not have fixed it.** Details below, with the maths.

---

## 1 · What actually fails

The `sunbaked` `--muted` token is **not** below AA. Measured against the real emitted values:

| Pair | Ratio | AA body (4.5) |
|---|---|---|
| `--muted` `#6F6153` on `--ground` `#F6EFE3` | **5.23:1** | ✅ pass |
| `--muted` `#6F6153` on `--surface` `#FFFBF3` | **5.80:1** | ✅ pass |

The failing colour is one nobody designed and nobody audited. `EmptyPrompt` renders its hint line as:

```tsx
// apps/kol/src/components/states/EmptyPrompt.tsx:20,25
<div className="… border-dashed border-line bg-surface/60 …">
  <p className="font-display text-h3 text-muted">{prompt}</p>
  {hint ? <p className="max-w-measure text-body text-muted/80">{hint}</p> : null}
</div>
```

Two alpha modifiers compound:

1. `bg-surface/60` composites `#FFFBF3` at 60 % over the page `--ground` `#F6EFE3` → effective backdrop **`#FBF6ED`**
2. `text-muted/80` composites `#6F6153` at 80 % over that backdrop → effective ink **`#8C8071`**

```
contrast(#8C8071, #FBF6ED) = 3.63:1     ← FAILS AA body (4.5:1)
```

Axe reported 3.62:1; the 0.01 delta is hex rounding of the composited values. Same defect.

`ErrorInline` uses `text-muted` at **full** opacity on `bg-surface` → **5.80:1**, which passes. The QA note listed it alongside `EmptyPrompt` because both are state components; the measured failure is the `EmptyPrompt` hint line, and any other `/80`-style modifier on an ink token.

## 2 · Why regrading the token alone does not fix it

The alpha modifier fails in **8 of the 10 palette × mode combinations**, not just `sunbaked` light. Measured, `text-muted/80` on `bg-surface/60`-over-`--ground`:

| Palette | Light | Dark |
|---|---|---|
| `sunbaked` | **3.63** ❌ | **4.49** ❌ |
| `market-plum` | **3.40** ❌ | 4.85 ✅ |
| `cuberto-noir` | **3.36** ❌ | **4.38** ❌ |
| `orchard` | **3.54** ❌ | **4.37** ❌ |
| `bazaar` | **3.66** ❌ | 5.16 ✅ |

Fixing only `sunbaked` light closes 1 of 8. And forcing `--muted` dark enough to survive an 80 % alpha requires pushing every light palette to roughly **7.6:1 on ground** — at which point the ink-to-muted separation collapses from 2.82× to 1.9×, `--muted` reads as body text, and the secondary-text hierarchy the whole design system depends on is gone in all five palettes. That is a real cost paid to work around one character class.

The renderer already learned this lesson once: `groundStyle()` in `blocks/shared.tsx` used to soften `--muted` to a 72 % mix on block-grounds and measured **3.32:1** on `sunbaked --block-a`; QA cycle 2 replaced it with the full on-block ink and left the comment *"On a colored ground, hierarchy comes from type scale, not a second ink."* That rule is correct and was only ever applied locally. It generalises.

## 3 · The fix — two parts, both ship

### Fix A (structural — this is the one that clears the finding)

**No opacity modifier is permitted on any ink token, anywhere.** Banned: `text-ink/*`, `text-muted/*`, `text-on-media/*`, `text-on-block-*/*`, `text-accent*/*`. Secondary hierarchy inside an already-secondary element comes from **type scale**, not a second alpha.

Concretely, in `EmptyPrompt.tsx:25`:

```diff
-<p className="max-w-measure text-body text-muted/80">{hint}</p>
+<p className="max-w-measure text-caption text-muted">{hint}</p>
```

`text-body` → `text-caption` restores the hierarchy the `/80` was reaching for, and does it with the scale. Result on the unchanged token: **5.56:1** ✅ (`#6F6153` on `#FBF6ED`).

**Guard it.** Add a regression test that greps `apps/kol/src/**/*.tsx` for `/^text-(ink|muted|on-media|on-block-[abc]|accent[a-z-]*)\/\d+$/` in class strings and fails on any match. This is the only way the class of defect stays fixed — a one-line component edit does not prevent the next one.

*(Background-token alphas — `bg-surface/60`, `bg-surface/85`, `bg-surface/90` — stay. They are backdrops, they are already measured against in the ratios above, and full-opacity ink clears AA on every one of them.)*

### Fix B (token headroom — sunbaked light only)

`sunbaked` light is KOL's **own chrome** default (`globals.css :root`), so it renders on every non-world page in the product. At 5.23:1 it clears AA body by 16 % — thin enough that any future translucent surface, scrim, or overlay puts it under. Give it real headroom:

```diff
  sunbaked: {
    light: {
-     ground: "#F6EFE3", surface: "#FFFBF3", ink: "#221C15", muted: "#6F6153",
+     ground: "#F6EFE3", surface: "#FFFBF3", ink: "#221C15", muted: "#645648",
```

**`--muted: #6F6153` → `#645648`** (same warm neutral-brown hue family, two steps darker).

| Pair | Before | After | Floor |
|---|---|---|---|
| `--muted` on `--ground` `#F6EFE3` | 5.23:1 | **6.19:1** | 4.5 ✅ |
| `--muted` on `--surface` `#FFFBF3` | 5.80:1 | **6.86:1** | 4.5 ✅ |
| `--muted` on `bg-surface/60` `#FBF6ED` | 5.56:1 | **6.58:1** | 4.5 ✅ |
| `--muted` on `bg-surface/85` `#FEF9F1` | 5.71:1 | **6.75:1** | 4.5 ✅ |
| *stress:* `--muted` at 90 % alpha on `#FBF6ED` | 4.47:1 ❌ | **5.17:1** ✅ | 4.5 |
| ink/muted separation (`--ink` is 14.76:1 on ground) | 2.82× | **2.38×** | — preserved |

The hierarchy survives: `--ink` at 14.76:1 against `--muted` at 6.19:1 is still a 2.4× separation, comfortably readable as primary vs secondary.

The other four palettes' `--muted` values are **left alone**. They all clear AA body at full opacity (4.78–5.27 light, 6.43–8.12 dark) and Fix A removes the only thing that was breaking them. Regrading all five to chase an alpha we have banned would cost the hierarchy in four worlds for no accessibility gain.

## 4 · Files to change

| File | Change |
|---|---|
| `apps/kol/src/components/states/EmptyPrompt.tsx` | Fix A — drop `/80`, hint to `text-caption` |
| `apps/kol/src/lib/theme/tokens.ts` | Fix B — `palettes.sunbaked.light.muted` → `#645648` |
| `apps/kol/src/app/globals.css` | Fix B — `:root { --muted: #645648; }` (chrome fallback must match) |
| `apps/kol/src/lib/theme/aa-audit.test.ts` | Add: `--muted` on ground/surface must clear **5.5:1**, not just 4.5 — encode the headroom so a future regrade cannot silently spend it |
| new: `apps/kol/src/lib/theme/no-ink-alpha.test.ts` | Fix A guard — the class-string grep described above |
| `docs/03-system-design/KOL-design-system.md` §2.1 | Update the `sunbaked` light `muted` hex; add the no-alpha-on-ink rule to §5 |
| `docs/04-features/KOL-block-catalog.md` cross-cutting | Add the no-alpha-on-ink rule alongside "4 states are non-negotiable" |

**Risk tier: Lite.** No API, DB, or auth surface; token + one component + two tests.

**Verification:** `pnpm test` (aa-audit + new guard) must pass, then axe-core over `/preview` in both Sena and Noor worlds across all five stage-rail stages must report zero contrast violations. The original finding was 6 nodes on Sena; the expected result is 0.

---

*All ratios computed with the WCAG 2.x relative-luminance formula over sRGB alpha compositing, matching `apps/kol/src/lib/theme/contrast.ts`. QA-Lead re-measures at the gate; nothing here is trusted from this doc.*

# `public/media` — the film drop-in contract

**Status: D12 maker footage does not exist yet.** Every film surface in the app
currently renders a designed gradient stand-in. That is deliberate — we do not
ship stock footage or generated video and call it a maker's world.

The *system* is real. The moment a clip lands in this folder and its path is set
on the maker record, the gradient is replaced by an actual `<video>` with no
component changes.

---

## How to drop footage in

1. Put the file at `public/media/<maker-slug>/<name>.mp4`
   (a poster still alongside it: `public/media/<maker-slug>/<name>-poster.jpg`).
2. Set `videoSrc` on that maker in `src/lib/mock/db.ts`:

   ```ts
   { slug: "sena", /* … */ videoSrc: "/media/sena/wheel.mp4" }
   ```

3. That's it. `HeroPlayer` and `<Film src=… />` pick it up.

In the live build these paths become Supabase storage / CDN URLs; the field and
the fallback behaviour are unchanged.

---

## File conventions

| Property   | Value                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Container  | `.mp4` (H.264 + AAC) as the baseline; `.webm` (VP9) optional alongside |
| Aspect     | `16/9` for hero/dock film · `4/5` and `1/1` crops for in-page frames   |
| Resolution | 1080p max — these are ambient loops, not features                      |
| Length     | 8–20s, seamlessly loopable                                             |
| Audio      | Ship with audio, but every surface plays **muted**; sound is opt-in    |
| Poster     | Same aspect as the clip, `.jpg`, ≤ 200 KB                              |
| Naming     | lowercase, hyphenated, scoped by maker slug                            |

## Behaviour guarantees (already implemented)

- **Muted, inline, `preload="metadata"`.** Never sound-on by default.
- **No autoplay under `prefers-reduced-motion: reduce`.** The poster holds.
- **404 / decode failure falls back to the maker's gradient** via `onError` —
  a missing file degrades quietly instead of showing a broken player.
- **The hero film never unmounts** (P4 invariant). The `<video>` lives inside
  the persistent film node, so playback is continuous across route changes for
  the same reason the elapsed clock is. Only changing maker restarts it.

## What is in here today

`ashwork/` and `tinctura/` hold SVG poster/product stand-ins for the two
store-config fixture worlds. No `.mp4` exists yet, by design.

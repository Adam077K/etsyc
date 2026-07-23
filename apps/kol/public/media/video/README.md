# KOL film clips — drop-in folder

Real maker clips live here. The product plays them through the shared
`<MakerFilm>` component (muted, looped, `playsInline`, autoplay only while on
screen) and falls back to the existing Ken-Burns still whenever a clip is
absent, `prefers-reduced-motion` is set, or a file fails to load. **No synthetic
humans** — only real footage of real makers (e.g. Pexels / Coverr stock, or the
team-produced world clips).

## How to activate a clip (two steps, no other code changes)

1. Drop the encoded file into this folder using the exact filename below.
2. Set the matching fixture `filmSrc` to `/media/video/<file>` (presence is read
   from the fixture field, never a network probe — so the field is the switch).

That's it — the surface starts playing it and every fallback keeps working.

### Recommended encode
Muted H.264 MP4, `yuv420p`, `+faststart`, ~2–5 s seamless loop, ≤ ~1.5 MB,
long edge ≤ 1440.

**Seamless loop.** `<MakerFilm>` plays with `loop`, so the last frame must flow
back into the first with no snap. Real filmed clips that start and end on a
matching frame loop naturally — encode those as-is. **Ken-Burns renders from a
still are monotonic (zoom 1.0 → 1.14) and WILL snap**, so boomerang them
(forward + reverse concat), which is how the placeholder below was made:

```
# 1) forward Ken-Burns pan (silent)
ffmpeg -y -loop 1 -i still.jpg -t 2.5 -r 30 \
  -vf "scale=1400:-2,zoompan=z='min(zoom+0.0016,1.14)':d=75:s=1280x720,format=yuv420p" \
  -c:v libx264 -preset medium -crf 30 -an fwd.mp4
# 2) reverse it, then 3) concat forward+reverse → seamless palindrome loop
ffmpeg -y -i fwd.mp4 -vf reverse -an rev.mp4
ffmpeg -y -i fwd.mp4 -i rev.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" \
  -map "[v]" -an -c:v libx264 -preset medium -crf 30 -movflags +faststart <file>.mp4
```

## Filename → surface → fixture field

| File | Surfaces it drives | Fixture field to set |
|------|--------------------|----------------------|
| `odd-clay.mp4` | cover hero, `/m/odd-clay` world hero + docked PiP, feed expand | `makers.ts` → `COVER_MAKER.filmSrc` **(LIVE — placeholder)** |
| `indigo-ash.mp4` | `/m/indigo-ash` world hero + docked PiP, feed expand | `makers.ts` → `MAKERS[id="indigo-ash"].filmSrc` |
| `grain-groove.mp4` | feed film tile + expand overlay | `makers.ts` → `MAKERS[id="grain-groove"].filmSrc` |
| `ember-rue.mp4` | feed film tile + expand overlay | `makers.ts` → `MAKERS[id="ember-rue"].filmSrc` |
| `mesa-marin.mp4` | feed film tile + expand overlay | `makers.ts` → `MAKERS[id="mesa-marin"].filmSrc` |
| `product-carafe.mp4` | `/m/odd-clay/p/carafe` docked PiP (contextual clip) | `commerce.ts` → `PRODUCT_DETAILS.carafe.filmSrc` |
| `product-wrap.mp4` | `/m/indigo-ash/p/wrap` docked PiP (contextual clip) | `commerce.ts` → `PRODUCT_DETAILS.wrap.filmSrc` |
| `thankyou-odd-clay.mp4` | `/thank-you` personal thank-you hero (Lena) | `commerce.ts` → `THANK_YOU_NOTES["odd-clay"].filmSrc` |
| `thankyou-indigo-ash.mp4` | `/thank-you` personal thank-you hero (Sabine) | `commerce.ts` → `THANK_YOU_NOTES["indigo-ash"].filmSrc` |

`odd-clay.mp4` is currently a **local Ken-Burns proof render** (a pan over
`clay-wheel.jpg`) so the pipeline is provable end-to-end today. Overwrite it with
Lena's real clip when it exists — same filename, no code change.

Only `odd-clay.filmSrc` is wired now; the other rows are intentionally unset so
nothing 404s before a file lands. Setting a field before its file exists is the
one thing to avoid — do both together.

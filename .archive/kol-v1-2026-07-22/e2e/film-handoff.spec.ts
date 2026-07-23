import { expect, test } from "@playwright/test";

/**
 * Film handoff across a REAL App Router navigation — /feed → /w/[handle]
 * (Gate-2 wave-close condition P2-A; QA-Lead brief 2026-07-22).
 *
 * The one seam jsdom cannot reach: router.push() swaps the feed tree for
 * the world tree while the root-layout FilmLayerProvider (app/layout.tsx)
 * must keep the SAME frame element alive. Before the useLayoutEffect fix
 * the frame cold-mounted at 0×0 after a claim raced the provider's
 * frameRef attach — step 4's rect assertions are exactly the ones that
 * failure shape breaks.
 *
 * Structural gate only (real footage absent): frame exists, frame is
 * non-zero, frame was not abandoned on navigation. No screenshots, no
 * contrast — footage-gated, out of scope here.
 *
 * Deviation from the brief, verified against the tree: the world settle
 * sentinel is [data-world-stage] (StoreWorld.tsx) — [data-hero-stage]
 * does not exist anywhere in src/.
 */

const FRAME = "[data-film-layer]";

declare global {
  interface Window {
    /** frame node captured on /feed — identity must survive the SPA nav */
    __handoffFrame?: Element;
  }
}

test("film handoff /feed → /w/[handle]: the root-layout frame survives navigation claimed and non-zero (no 0×0 cold mount)", async ({
  page,
}) => {
  // two dev-server first-compiles (/feed, /w/[handle]) can land in one run
  test.setTimeout(120_000);

  // ---- 1. /feed — the frame is active and non-zero --------------------
  await page.goto("/feed");
  const cards = page.locator("[data-feed-card]");
  const cardCount = await cards.count();
  test.skip(
    cardCount === 0,
    "staging feed returned no cards — no published seed world reachable (brief environment requirement unmet)",
  );

  await expect(page.locator(FRAME), "film frame exists on /feed").toBeAttached();
  // the focus model claims the frame on load; claimed means unparked
  await page.waitForSelector(`${FRAME}:not([data-film-parked])`, { timeout: 20_000 });
  await page.waitForFunction(
    () => {
      const rect = document.querySelector("[data-film-layer]")?.getBoundingClientRect();
      return rect !== undefined && rect.width > 0 && rect.height > 0;
    },
    undefined,
    { timeout: 20_000 },
  );
  await expect(
    page.locator(`${FRAME} video`).first(),
    "a <video> is mounted inside the frame on /feed",
  ).toBeAttached({ timeout: 20_000 });

  // capture node identity + the feed clip for steps 4/5
  const feedSrc = await page.evaluate(() => {
    const frame = document.querySelector("[data-film-layer]") as HTMLElement;
    window.__handoffFrame = frame;
    return (
      frame.querySelector("video.kol-film-front")?.getAttribute("src") ??
      frame.querySelector("video")?.getAttribute("src") ??
      ""
    );
  });

  // ---- 2. first tap — card → grown column (the seam that was unwired) --
  await cards.first().locator("button").first().click();
  await expect(
    page.locator("[data-grow-column]"),
    "grown column mounts on the card tap",
  ).toBeAttached({ timeout: 10_000 });

  // ---- 3. second tap — the film itself → world navigation --------------
  // GrownColumn advances on any non-button click landing inside the frame
  // (GrownColumn.tsx §"second tap"); 24,24 avoids film chrome buttons.
  await page.locator(FRAME).click({ position: { x: 24, y: 24 } });
  await page.waitForURL(/\/w\/[^/]+(?:[?#].*)?$/, { timeout: 30_000 });

  // ---- 4. after the world settles — the cold-mount assertions ----------
  await page.waitForSelector("[data-world-stage]", { timeout: 30_000 });

  const after = await page.evaluate(() => {
    const frame = document.querySelector("[data-film-layer]") as HTMLElement | null;
    const rect = frame?.getBoundingClientRect();
    return {
      present: frame !== null,
      sameNode: frame !== null && frame === window.__handoffFrame,
      parked: frame?.hasAttribute("data-film-parked") ?? true,
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      videoCount: frame?.querySelectorAll("video").length ?? 0,
      worldSrc:
        frame?.querySelector("video.kol-film-front")?.getAttribute("src") ??
        frame?.querySelector("video")?.getAttribute("src") ??
        "",
    };
  });

  expect(after.present, "frame still in the DOM after navigation").toBe(true);
  expect(
    after.sameNode,
    "frame is the SAME node captured on /feed — a replacement means the root-layout provider remounted",
  ).toBe(true);
  // THE cold-mount gate: claimed-but-0×0 is the bug's exact signature
  expect(after.width, `frame width after navigation (got ${after.width})`).toBeGreaterThan(0);
  expect(after.height, `frame height after navigation (got ${after.height})`).toBeGreaterThan(0);
  expect(after.videoCount, "a <video> is present inside the frame on the world").toBeGreaterThan(0);
  // the world CLAIMED the frame — an abandoned frame parks on feed unmount
  expect(after.parked, "frame is claimed (unparked) by the world hero").toBe(false);

  // measured evidence for the gate log — the numbers the assertions saw
  test.info().annotations.push({
    type: "handoff-rect",
    description:
      `post-nav frame: ${after.width.toFixed(0)}×${after.height.toFixed(0)}, ` +
      `sameNode=${after.sameNode}, parked=${after.parked}, videos=${after.videoCount}, ` +
      `url=${page.url()}`,
  });

  // ---- 5. src evidence (recommended, non-binding) ----------------------
  // The world's WORLD_OPEN engine read pins the store's signature clip; the
  // tapped card may legitimately BE that clip (same store), so src equality
  // cannot be asserted either way — recorded for the gate log instead.
  test.info().annotations.push({
    type: "handoff-src",
    description:
      `feed front src: ${feedSrc || "(none)"} → world front src: ${after.worldSrc || "(none)"} — ` +
      (after.worldSrc === ""
        ? "world frame has no src (engine unpinned?)"
        : after.worldSrc === feedSrc
          ? "same clip (store signature clip may equal the tapped card's clip)"
          : "world swapped to its own engine-selected clip"),
  });
});

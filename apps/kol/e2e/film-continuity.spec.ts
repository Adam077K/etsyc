import { test, expect, type Page } from "@playwright/test";

/**
 * The acceptance bar for Wave 3 Track A: from feed tap to thank-you, the active
 * maker's film is NEVER re-mounted from black. These tests prove it two ways:
 *
 *  1. DOM-node identity — a token is stamped on the persistent stage element on
 *     the world route, and asserted still present (same node) at product,
 *     checkout, and thank-you. If the film had re-mounted at any seam the
 *     attribute would be gone. Screenshots are captured at each seam.
 *  2. currentTime continuity — the real odd-clay clip's <video> element is the
 *     same node across world→product and its playhead does not reset to 0.
 */

const SHOTS = "e2e/__screens__";
const stage = (p: Page) => p.locator('[data-film-node="stage"]');

test("the film element is never re-mounted across the buyer journey", async ({
  page,
}) => {
  // No console errors anywhere on the journey (FLOOR: zero console errors).
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  // Feed → tap Lena's cover film → her world (the handoff into the stage).
  await page.goto("/");
  await page.getByRole("button", { name: /Enter Odd Clay Studio/i }).click();
  await page.waitForURL("**/m/odd-clay");
  await expect(stage(page)).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/1-world.png` });

  // Stamp the persistent node; it must survive every subsequent route change.
  const token = `proof-${Date.now()}`;
  await stage(page).evaluate((el, t) => el.setAttribute("data-proof", t), token);
  const persisted = page.locator(
    `[data-film-node="stage"][data-proof="${token}"]`,
  );

  // World → product.
  await page.locator('a[href="/m/odd-clay/p/carafe"]').first().click();
  await page.waitForURL("**/p/carafe");
  await expect(persisted).toHaveCount(1);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/2-product.png` });

  // Product → checkout.
  await page.getByRole("button", { name: /Add to bag/i }).click();
  await page.getByRole("link", { name: /Go to checkout/i }).click();
  await page.waitForURL("**/checkout");
  await expect(persisted).toHaveCount(1);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/3-checkout.png` });

  // Checkout → thank-you.
  await page.getByRole("button", { name: /Place order/i }).click();
  await page.waitForURL("**/thank-you");
  await expect(persisted).toHaveCount(1);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/4-thank-you.png` });

  expect(errors, `console errors on journey:\n${errors.join("\n")}`).toEqual([]);
});

test.describe("reduced motion", () => {
  test("the film keeps its presence across a seam (poster, no abrupt vanish)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/m/odd-clay");
    await expect(stage(page)).toBeVisible();
    // Reduced motion → the stage settles to the still poster, not an autoplay
    // video (framer's useReducedMotion resolves just after hydration).
    await expect(stage(page).locator("img")).toBeVisible({ timeout: 10_000 });
    await expect(stage(page).locator("video")).toHaveCount(0);

    const token = `rm-${Date.now()}`;
    await stage(page).evaluate((el, t) => el.setAttribute("data-proof", t), token);
    await page.locator('a[href="/m/odd-clay/p/carafe"]').first().click();
    await page.waitForURL("**/p/carafe");
    // The frame persists (same node) — presence continuity without motion.
    await expect(
      page.locator(`[data-film-node="stage"][data-proof="${token}"]`),
    ).toHaveCount(1);
    await expect(stage(page)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/5-reduced-motion-product.png` });
  });
});

test("the live clip keeps its playhead across world→product", async ({
  page,
}) => {
  await page.goto("/m/odd-clay");
  const video = page.locator('[data-film-node="stage"] video');
  await expect(video).toHaveCount(1);
  // Nudge playback in case headless autoplay is conservative, then let it run.
  await video.evaluate((v: HTMLVideoElement) => v.play().catch(() => {}));
  await page.waitForTimeout(1600);
  const t1 = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  expect(t1).toBeGreaterThan(0);

  // Stamp the <video> element itself, then go deeper into a product.
  await video.evaluate((v) => v.setAttribute("data-proof-v", "V"));
  await page.locator('a[href="/m/odd-clay/p/carafe"]').first().click();
  await page.waitForURL("**/p/carafe");

  const sameVideo = page.locator(
    '[data-film-node="stage"] video[data-proof-v="V"]',
  );
  await expect(sameVideo).toHaveCount(1); // same DOM node — not recreated
  await page.waitForTimeout(700);
  const t2 = await sameVideo.evaluate((v: HTMLVideoElement) => v.currentTime);
  // The playhead advanced (or held) — it did NOT reset to 0 at the route seam.
  expect(t2).toBeGreaterThanOrEqual(t1 - 0.15);
});

import { expect, test } from "@playwright/test";
import { heroElapsed, resetState } from "./helpers";

/**
 * THE SIGNATURE MECHANIC (P4 / D5).
 *
 * The maker's film must never unmount and never pause as the buyer moves
 * feed → GROWN → WORLD → NARRATE. HeroPlayer lives above the router, so the
 * only observable proof is the elapsed clock: if it ever goes BACKWARDS
 * across a route change, the element remounted and the invariant is broken.
 *
 * Every hop here is a client-side click. A full page load legitimately
 * remounts everything, so navigating by URL would be a false failure.
 */

const heroStage = "[data-hero-stage]";

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("film grows on a feed tap, opens the world, then narrates — one continuous clock", async ({
  page,
}) => {
  await page.goto("/");

  /* ---------- feed tap → GROWN ---------- */
  await page
    .getByRole("link", { name: /Sena throws the last of the ridge tumblers/i })
    .click();

  const hero = page.locator(heroStage);
  await expect(hero).toHaveAttribute("data-hero-stage", "grown");
  await expect(page).toHaveURL(/\/$/); // the feed is still the route — the film grew in place

  // let the clock tick past 0:00 so a reset is actually distinguishable
  await expect.poll(() => heroElapsed(page), { timeout: 15_000 }).toBeGreaterThan(0);
  const atGrown = await heroElapsed(page);

  /* ---------- "Open Sena's world" → WORLD, same film ---------- */
  await page.getByRole("link", { name: /Open Sena.s world/i }).click();

  await expect(page).toHaveURL(/\/m\/sena$/);
  await expect(hero).toHaveAttribute("data-hero-stage", "world");
  await expect(page.getByText(/Still playing/i).first()).toBeVisible();

  const atWorld = await heroElapsed(page);
  expect(
    atWorld,
    `film clock went backwards across feed → world (${atGrown}s → ${atWorld}s): it remounted`,
  ).toBeGreaterThanOrEqual(atGrown);

  /* ---------- product inside the world → NARRATE, same film ---------- */
  await page.getByRole("link", { name: /Ridge Tumbler/i }).first().click();

  await expect(page).toHaveURL(/\/m\/sena\/p\//);
  await expect(hero).toHaveAttribute("data-hero-stage", "narrate");

  // the caption swaps to what the film is now narrating
  await expect(hero).toContainText(/Ridge tumbler/i);

  const atNarrate = await heroElapsed(page);
  expect(
    atNarrate,
    `film clock went backwards across world → product (${atWorld}s → ${atNarrate}s): it remounted`,
  ).toBeGreaterThanOrEqual(atWorld);
});

test("the film keeps counting while parked on the product page", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /Sena throws the last of the ridge tumblers/i })
    .click();
  await page.getByRole("link", { name: /Open Sena.s world/i }).click();
  await page.getByRole("link", { name: /Ridge Tumbler/i }).first().click();
  await expect(page.locator(heroStage)).toHaveAttribute("data-hero-stage", "narrate");

  const start = await heroElapsed(page);
  await expect
    .poll(() => heroElapsed(page), { timeout: 15_000 })
    .toBeGreaterThan(start);
});

test("dismissing the film is the only thing that stops it", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /Sena throws the last of the ridge tumblers/i })
    .click();
  await expect(page.locator(heroStage)).toHaveAttribute("data-hero-stage", "grown");

  await page.getByRole("button", { name: /Back to feed/i }).click();
  await expect(page.locator(heroStage)).toHaveCount(0);
});

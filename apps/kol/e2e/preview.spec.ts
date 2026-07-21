import { expect, test, type Page } from "@playwright/test";

/** Walk the page so every IntersectionObserver-gated Reveal fires. */
async function revealAll(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
}

/**
 * Minimal /preview capture — full-page screenshots of both fixture worlds
 * plus the state matrix, for design-critic review. Assertions are smoke-level
 * on purpose; visual judgment is the critic's job, not Playwright's.
 */
test("sena (curated) world renders and screenshots", async ({ page }) => {
  await page.goto("/preview");
  await expect(page.locator("#world [data-theme-kind='curated']")).toBeVisible();
  await expect(page.locator("#state-matrix")).toBeVisible();
  await revealAll(page);
  await page.screenshot({
    path: "e2e/__screenshots__/preview-sena.png",
    fullPage: true,
  });
});

test("noor (custom any-hex) world renders and screenshots", async ({ page }) => {
  await page.goto("/preview?fixture=custom");
  await expect(page.locator("#world [data-theme-kind='custom']")).toBeVisible();
  // the 4-state matrix follows the fixture — custom path gets full coverage
  await expect(page.locator("#state-matrix")).toBeVisible();
  await revealAll(page);
  await page.screenshot({
    path: "e2e/__screenshots__/preview-custom.png",
    fullPage: true,
  });
});

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

/**
 * Gate-2 P1 regression (real layout, not jsdom): the sena statement — 44
 * chars, sets multi-line in the center-column rect — must stay inside the
 * film frame with every set line on SOLID scrim (below the band's fade
 * zone). This is the capture that shipped with line 1 on bare page ground
 * at 1.04:1; it must never come back.
 */
test("gate-2: multi-line statement stays inside the film rect, every line on solid scrim", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/preview");
  await expect(page.locator("#world .kol-hero-chrome h1")).toBeVisible();
  // let the unfold settle (900ms hard cap) + the fit effect apply
  await page.waitForTimeout(1100);
  const geo = await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>("#world .kol-scrim");
    const chrome = frame?.querySelector<HTMLElement>(".kol-hero-chrome");
    const h1 = chrome?.querySelector("h1");
    if (!frame || !chrome || !h1) return null;
    const rect = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
    };
    const range = document.createRange();
    range.selectNodeContents(h1);
    let lines = 0;
    let lastTop = Number.NEGATIVE_INFINITY;
    for (const r of range.getClientRects()) {
      if (r.width <= 1 || r.height <= 1) continue;
      if (Math.abs(r.top - lastTop) > r.height / 2) {
        lines += 1;
        lastTop = r.top;
      }
    }
    return {
      frame: rect(frame),
      chrome: rect(chrome),
      h1: rect(h1),
      fade: parseFloat(getComputedStyle(chrome).paddingTop),
      lines,
    };
  });
  expect(geo).not.toBeNull();
  if (!geo) return;
  // the regression shape: this statement sets to MULTIPLE lines here, and
  // the fit caps it at three (the char budget said "fine" and shipped four
  // invisible words instead)
  expect(geo.lines).toBeGreaterThanOrEqual(2);
  expect(geo.lines).toBeLessThanOrEqual(3);
  // the whole band, and the display block, sit INSIDE the film rect —
  // nothing paints on page ground
  expect(geo.chrome.top).toBeGreaterThanOrEqual(geo.frame.top - 0.5);
  expect(geo.h1.top).toBeGreaterThanOrEqual(geo.frame.top - 0.5);
  expect(geo.h1.bottom).toBeLessThanOrEqual(geo.frame.bottom + 0.5);
  // every set line is on SOLID scrim: line 1 starts below the fade zone
  expect(geo.h1.top).toBeGreaterThanOrEqual(geo.chrome.top + geo.fade - 0.5);
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

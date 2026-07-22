import { expect, test, type Page } from "@playwright/test";

/**
 * B1's HARD GATE (discovery-feed AC "Layout identity", CPO Ruling 2) on
 * REAL measured boxes — jsdom does no layout, so the anti-grid assertion
 * lives here, against the fixture harness at /preview/feed.
 *
 * The binding assertion, both halves:
 *   (a) ≥3 distinct rendered card widths and no single repeating cell
 *       size across the viewport;
 *   (b) no two adjacent cards share a getBoundingClientRect().top within
 *       24px — (b) is the assertion that actually catches a grid; (a) is
 *       passable by a two-cell-size grid.
 *
 * The detector is PROVEN against a negative control (?grid=1 renders the
 * same cards as a uniform 3-col grid): the same measurement that passes
 * the magazine must fail the grid — video in cells does not rescue
 * grid-ness, layout does (mutation-verification standard).
 */

interface MeasuredCard {
  top: number;
  width: number;
  height: number;
  slot: string | null;
}

async function measureCards(page: Page): Promise<MeasuredCard[]> {
  return page.$$eval("[data-feed-card]", (elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        slot: element.getAttribute("data-feed-slot"),
      };
    }),
  );
}

/** The machine form of the anti-grid AC. Empty array = the layout passes. */
function antiGridViolations(cards: MeasuredCard[]): string[] {
  const violations: string[] = [];
  const widths = new Set(cards.map((card) => card.width));
  if (widths.size < 3) {
    violations.push(`only ${widths.size} distinct card width(s)`);
  }
  const cellSizes = new Set(cards.map((card) => `${card.width}x${card.height}`));
  if (cellSizes.size < 3) {
    violations.push(`a repeating cell size covers the feed (${cellSizes.size} distinct)`);
  }
  for (let i = 0; i + 1 < cards.length; i += 1) {
    const a = cards[i];
    const b = cards[i + 1];
    if (a && b && Math.abs(b.top - a.top) <= 24) {
      violations.push(`adjacent cards ${i} and ${i + 1} share a top edge within 24px`);
    }
  }
  return violations;
}

/** Walk the page so every IntersectionObserver-gated Reveal fires. */
async function revealAll(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
}

test.describe("anti-grid hard gate — desktop 1440", () => {
  test("N=18: ≥3 widths, no repeating cell, no shared adjacent tops", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    const cards = await measureCards(page);
    expect(antiGridViolations(cards)).toEqual([]);
    // masthead count is live and honest
    await expect(
      page.getByRole("heading", { level: 1, name: "Eighteen people who make things." }),
    ).toBeVisible();
  });

  test("N=4 (the seed period): the anti-grid invariant already holds", async ({ page }) => {
    await page.goto("/preview/feed?n=4");
    await expect(page.locator("[data-feed-card]")).toHaveCount(4);
    const cards = await measureCards(page);
    expect(antiGridViolations(cards)).toEqual([]);
    await expect(
      page.getByRole("heading", { level: 1, name: "Four people who make things." }),
    ).toBeVisible();
  });

  test("NEGATIVE CONTROL: the detector rejects a uniform grid of the same cards", async ({ page }) => {
    await page.goto("/preview/feed?n=18&grid=1");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    const cards = await measureCards(page);
    const violations = antiGridViolations(cards);
    // a uniform 3-col grid fails BOTH halves of the assertion
    expect(violations.some((v) => v.includes("distinct card width"))).toBe(true);
    expect(violations.some((v) => v.includes("share a top edge"))).toBe(true);
  });

  test("small-N terminations render the specified compositions", async ({ page }) => {
    const expectations: Array<[number, string[]]> = [
      [1, ["WIDE"]],
      [2, ["LEAD", "SIDE"]],
      [3, ["LEAD", "SIDE", "WIDE"]],
      [4, ["LEAD", "SIDE", "INSET", "TALL"]],
      // N=6 exercises the orphan-promotion rule: S1 S2 S3 + promoted WIDE
      [6, ["LEAD", "SIDE", "WIDE", "INSET", "TALL", "WIDE"]],
    ];
    for (const [n, slots] of expectations) {
      await page.goto(`/preview/feed?n=${n}`);
      await expect(page.locator("[data-feed-card]")).toHaveCount(n);
      const measured = await measureCards(page);
      expect(measured.map((card) => card.slot)).toEqual(slots);
    }
  });
});

test.describe("anti-grid on mobile — variety carried by height", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("single column cycles aspects: ≥3 distinct heights, neighbours differ", async ({ page }) => {
    await page.goto("/preview/feed?n=8");
    await expect(page.locator("[data-feed-card]")).toHaveCount(8);
    const cards = await measureCards(page);
    const heights = cards.map((card) => card.height);
    expect(new Set(heights).size).toBeGreaterThanOrEqual(3);
    for (let i = 0; i + 1 < heights.length; i += 1) {
      expect(Math.abs((heights[i + 1] ?? 0) - (heights[i] ?? 0))).toBeGreaterThan(24);
    }
  });
});

test.describe("Focus Film wiring — one shared player, a feed that reads alive", () => {
  test("one film layer, positioned over the focus card; ≥2 cards in motion at N=4", async ({ page }) => {
    await page.goto("/preview/feed?n=4");
    // exactly ONE shared film element for the whole feed
    await expect(page.locator("[data-film-layer]")).toHaveCount(1);
    // the initial focus claim lands after the entrance reveal settles
    await expect(page.locator("[data-feed-focus]")).toHaveCount(1, { timeout: 5_000 });

    const filmBox = await page.locator("[data-film-layer]").boundingBox();
    const mediaBox = await page
      .locator("[data-feed-focus] [data-feed-media]")
      .boundingBox();
    expect(filmBox).not.toBeNull();
    expect(mediaBox).not.toBeNull();
    if (filmBox && mediaBox) {
      // the shared frame sits on the focus card's media rect
      expect(Math.abs(filmBox.x - mediaBox.x)).toBeLessThanOrEqual(8);
      expect(Math.abs(filmBox.y - mediaBox.y)).toBeLessThanOrEqual(8);
      expect(Math.abs(filmBox.width - mediaBox.width)).toBeLessThanOrEqual(8);
    }

    // the ≥2-in-motion floor: focus + at least one ambient neighbour is
    // WIRED (fixture clips 404 by design, so playback itself is judged on
    // staging footage — the structural claim is what a fixture can prove)
    const motionCount = await page.locator("[data-feed-motion]").count();
    expect(motionCount).toBeGreaterThanOrEqual(2);
    await expect(page.locator("[data-feed-ambient-video]").first()).toBeAttached();
  });

  test("tapping a non-focus card promotes it to focus", async ({ page }) => {
    await page.goto("/preview/feed?n=4");
    await expect(page.locator("[data-feed-focus]")).toHaveCount(1, { timeout: 5_000 });
    // click whichever OPENING-spread card is not focus — both are in the
    // viewport at scroll 0, so no scroll fires and no debounce re-target
    // races the assertion
    const focusSlot = await page
      .locator("[data-feed-focus]")
      .getAttribute("data-feed-slot");
    const targetSlot = focusSlot === "LEAD" ? "SIDE" : "LEAD";
    const target = page.locator(`[data-feed-card][data-feed-slot='${targetSlot}']`);
    await target.locator("button").click({ position: { x: 24, y: 24 } });
    await expect(target).toHaveAttribute("data-feed-focus", "");
    await expect(page.locator("[data-feed-focus]")).toHaveCount(1);
  });
});

test.describe("design-critic captures (discovery-feed OQ-3 — eyes-on gate)", () => {
  test("N=4 seed-period composition", async ({ page }) => {
    await page.goto("/preview/feed?n=4");
    await revealAll(page);
    await page.screenshot({
      path: "e2e/__screenshots__/feed-magazine-n4.png",
      fullPage: true,
    });
  });

  test("N=18 full-book composition", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await revealAll(page);
    await page.screenshot({
      path: "e2e/__screenshots__/feed-magazine-n18.png",
      fullPage: true,
    });
  });

  test("mobile composition", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/preview/feed?n=8");
    await revealAll(page);
    await page.screenshot({
      path: "e2e/__screenshots__/feed-magazine-mobile.png",
      fullPage: true,
    });
  });
});

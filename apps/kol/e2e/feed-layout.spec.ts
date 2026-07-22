import { expect, test, type Page } from "@playwright/test";

import { buildFixtureCards } from "../src/app/preview/feed/fixtures";
import { ambientCountForVisible } from "../src/components/feed/focus";
import { composeFeed, composeMobileFeed } from "../src/components/feed/spreads";

/**
 * B1's HARD GATE (discovery-feed AC "Layout identity", gate-2 rulings) on
 * REAL measured boxes — jsdom does no layout, so pixel truth lives here,
 * against the fixture harness at /preview/feed.
 *
 * The binding desktop assertions (screen-specs §1.7):
 *   (a) ≥3 distinct rendered card widths, no single repeating cell size;
 *   (b) no two adjacent cards share a getBoundingClientRect().top within
 *       24px;
 *   (c) THE PERIOD GATE — across N=18 no ordered slot sequence of length
 *       3–6 occurs more than twice, and ≥4 distinct row patterns appear.
 *       (a) and (b) both PASSED the old S1→S2→S3 cycle, which the gate-2
 *       critic proved was a grid with a longer period; (c) is the
 *       assertion that catches a cycle. All three are necessary.
 *
 * Mobile at 375 (screen-specs §1.6/§1.7):
 *   (d) no two adjacent cards share a rendered media width within 8px;
 *   (e) the dominant left edge breaks within every 3 consecutive cards.
 *       (The literal every-viewport form of (e) is unsatisfiable under
 *       the binding §1.6 slot table: (d) forbids M-OFF-L↔M-OFF-R
 *       adjacency and the bleed is gap-limited, so an occasional
 *       same-edge PAIR is forced; runs of 3+ never are. The composer
 *       prices pairs high, so they stay rare.)
 *
 * The detector is PROVEN against a negative control (?grid=1 renders the
 * same cards as a uniform 3-col grid), and the period gate is mutation-
 * verified in spreads.test.ts against the restored cycle.
 */

interface MeasuredCard {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
  slot: string | null;
  mobileSlot: string | null;
  row: string | null;
}

async function measureCards(page: Page): Promise<MeasuredCard[]> {
  return page.$$eval("[data-feed-card]", (elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top + window.scrollY),
        bottom: Math.round(rect.bottom + window.scrollY),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        slot: element.getAttribute("data-feed-slot"),
        mobileSlot: element.getAttribute("data-feed-mobile-slot"),
        row: element.closest("[data-feed-row]")?.getAttribute("data-feed-row") ?? null,
      };
    }),
  );
}

/** Media boxes (the §1.6 insets live on the media, not the article). */
async function measureMedia(page: Page) {
  return page.$$eval("[data-feed-card] [data-feed-media]", (elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        top: Math.round(rect.top + window.scrollY),
      };
    }),
  );
}

/** The machine form of anti-grid (a)+(b). Empty array = the layout passes. */
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

/** Assertion (c): the period gate, on rendered slot order. */
function periodViolations(slots: readonly (string | null)[]): string[] {
  const violations: string[] = [];
  for (let length = 3; length <= 6; length += 1) {
    const counts = new Map<string, number>();
    for (let i = 0; i + length <= slots.length; i += 1) {
      const key = slots.slice(i, i + length).join("→");
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      if (next === 3) {
        violations.push(`slot sequence [${key}] occurs ${next}× — the layout is cycling`);
      }
    }
  }
  return violations;
}

function overlapViolations(cards: MeasuredCard[]): string[] {
  const violations: string[] = [];
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const a = cards[i];
      const b = cards[j];
      if (!a || !b) continue;
      // 1px tolerance on rounded rects
      const overlaps =
        a.left + 1 < b.right &&
        b.left + 1 < a.right &&
        a.top + 1 < b.bottom &&
        b.top + 1 < a.bottom;
      if (overlaps) {
        violations.push(`cards ${i}(${a.slot}) and ${j}(${b.slot}) overlap`);
      }
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
  test("N=18: (a) widths, (b) tops, (c) period gate, ≥4 row patterns", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    const cards = await measureCards(page);
    expect(antiGridViolations(cards)).toEqual([]);
    expect(periodViolations(cards.map((card) => card.slot))).toEqual([]);
    const rowPatterns = new Set(cards.map((card) => card.row));
    expect(rowPatterns.size).toBeGreaterThanOrEqual(4);
    // masthead count is live and honest — 18 DISTINCT makers (gate-2
    // finding 4: the fixture pool no longer cycles 12 names)
    await expect(
      page.getByRole("heading", { level: 1, name: "Eighteen people who make things." }),
    ).toBeVisible();
    const names = await page.$$eval("[data-feed-card] h2", (els) =>
      els.map((el) => el.textContent ?? ""),
    );
    expect(new Set(names).size).toBe(18);
  });

  test("N=18: rendered composition is exactly the model's (parity gate)", async ({ page }) => {
    const fixture = buildFixtureCards(18);
    const expectedSlots = composeFeed(fixture).flatMap((row) =>
      row.slots.map(({ slot }) => slot.name),
    );
    const expectedMobile = composeMobileFeed(fixture).map(({ slot }) => slot.name);
    await page.goto("/preview/feed?n=18");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    const cards = await measureCards(page);
    expect(cards.map((card) => card.slot)).toEqual(expectedSlots);
    expect(cards.map((card) => card.mobileSlot)).toEqual(expectedMobile);
  });

  test("no two cards overlap — the raise pass mirrors CSS flow (1440 and 1024)", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    expect(overlapViolations(await measureCards(page))).toEqual([]);

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(150);
    expect(overlapViolations(await measureCards(page))).toEqual([]);
  });

  test("N=4 (the seed period): the ~510px void is owned — TALL clusters under SIDE", async ({ page }) => {
    await page.goto("/preview/feed?n=4");
    await expect(page.locator("[data-feed-card]")).toHaveCount(4);
    const cards = await measureCards(page);
    expect(antiGridViolations(cards)).toEqual([]);
    expect(overlapViolations(cards)).toEqual([]);
    const side = cards.find((card) => card.slot === "SIDE");
    const tall = cards.find((card) => card.slot === "TALL");
    expect(side).toBeDefined();
    expect(tall).toBeDefined();
    if (side && tall) {
      const air = tall.top - side.bottom;
      // clustered (--space-10-ish), not the ~510px unowned void the
      // gate-2 critic measured; asymmetric against the left side's pause
      expect(air).toBeGreaterThanOrEqual(48);
      expect(air).toBeLessThanOrEqual(200);
    }
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
    // and the period gate rejects its slot monotony outright
    expect(periodViolations(cards.map((card) => card.slot))).not.toEqual([]);
  });

  test("small-N terminations render the §1.1 table; N=6 matches the model", async ({ page }) => {
    const expectations: Array<[number, string[]]> = [
      [1, ["WIDE"]],
      [2, ["LEAD", "SIDE"]],
      [3, ["LEAD", "SIDE", "WIDE"]],
      [4, ["LEAD", "SIDE", "INSET", "TALL"]],
      [
        6,
        composeFeed(buildFixtureCards(6)).flatMap((row) =>
          row.slots.map(({ slot }) => slot.name),
        ),
      ],
    ];
    for (const [n, slots] of expectations) {
      await page.goto(`/preview/feed?n=${n}`);
      await expect(page.locator("[data-feed-card]")).toHaveCount(n);
      const measured = await measureCards(page);
      expect(measured.map((card) => card.slot)).toEqual(slots);
    }
  });
});

test.describe("mobile at 375 — the left edge is the identity (§1.6)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("(d) adjacent media widths differ >8px; (e) the dominant edge breaks within any 3 cards", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    const media = await measureMedia(page);
    expect(media).toHaveLength(18);

    for (let i = 0; i + 1 < media.length; i += 1) {
      const a = media[i];
      const b = media[i + 1];
      if (!a || !b) continue;
      expect(
        Math.abs(a.width - b.width),
        `cards ${i},${i + 1} share a rendered width`,
      ).toBeGreaterThan(8);
    }

    // ≥3 distinct left edges and ≥3 distinct widths — edge AND height
    // carry the variety, never width equality
    expect(new Set(media.map((m) => m.left)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(media.map((m) => m.width)).size).toBeGreaterThanOrEqual(3);

    // (e) — the dominant edge (--space-4 = 32) never survives 3 cards
    for (let i = 0; i + 2 < media.length; i += 1) {
      const window3 = media.slice(i, i + 3);
      expect(
        window3.some((m) => Math.abs(m.left - 32) > 1),
        `cards ${i}–${i + 2} all sit on the dominant left edge`,
      ).toBe(true);
    }

    // one slot bleeds past both margins
    const bleed = media.find((m) => m.left <= 1);
    expect(bleed).toBeDefined();
    expect(bleed?.width ?? 0).toBeGreaterThanOrEqual(373);
  });

  test("captions align to their own media's left edge (the zig-zag rule)", async ({ page }) => {
    await page.goto("/preview/feed?n=8");
    await expect(page.locator("[data-feed-card]")).toHaveCount(8);
    const rows = await page.$$eval("[data-feed-card]", (elements) =>
      elements.map((element) => {
        const media = element.querySelector("[data-feed-media]");
        const name = element.querySelector("h2");
        return {
          slot: element.getAttribute("data-feed-mobile-slot"),
          mediaLeft: media ? Math.round(media.getBoundingClientRect().left) : null,
          nameLeft: name ? Math.round(name.getBoundingClientRect().left) : null,
        };
      }),
    );
    for (const row of rows) {
      expect(row.mediaLeft).not.toBeNull();
      expect(row.nameLeft).not.toBeNull();
      if (row.mediaLeft === null || row.nameLeft === null) continue;
      if (row.slot === "M-BLEED") {
        // a bleed's media sits at 0; its caption indents --space-4
        expect(Math.abs(row.nameLeft - 32)).toBeLessThanOrEqual(1);
      } else {
        expect(
          Math.abs(row.nameLeft - row.mediaLeft),
          `${row.slot}: caption is not flush with its media`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("rhythm: --space-12 after a bleed, --space-8 after an inset", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await expect(page.locator("[data-feed-card]")).toHaveCount(18);
    const cards = await measureCards(page);
    for (let i = 0; i + 1 < cards.length; i += 1) {
      const current = cards[i];
      const next = cards[i + 1];
      if (!current || !next) continue;
      const gap = next.top - current.bottom;
      const expected = current.mobileSlot === "M-BLEED" ? 96 : 64;
      expect(
        Math.abs(gap - expected),
        `gap after card ${i} (${current.mobileSlot}) is ${gap}, expected ${expected}`,
      ).toBeLessThanOrEqual(2);
    }
  });
});

test.describe("Focus Film wiring — one shared player, ambient scaled to view", () => {
  test("one film layer on the focus card; ambient count follows cards-in-view", async ({ page }) => {
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

    // gate-2 ambient ruling: 0 ambient at ≤2 cards in view · 1 at 3 ·
    // 2 at ≥4. Motion = the focus film + the ambient budget. (Fixture
    // clips 404 by design — the structural claim is what a fixture can
    // prove; playback is judged on staging footage.)
    const inView = await page.$$eval("[data-feed-card]", (elements) =>
      elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      }).length,
    );
    const expectedMotion = 1 + ambientCountForVisible(inView);
    await expect(page.locator("[data-feed-motion]")).toHaveCount(expectedMotion);
    if (expectedMotion > 1) {
      await expect(page.locator("[data-feed-ambient-video]").first()).toBeAttached();
    } else {
      await expect(page.locator("[data-feed-ambient-video]")).toHaveCount(0);
    }
  });

  test("tapping a non-focus card promotes it to focus", async ({ page }) => {
    await page.goto("/preview/feed?n=4");
    await expect(page.locator("[data-feed-focus]")).toHaveCount(1, { timeout: 5_000 });
    // click whichever OPENING-row card is not focus — both are in the
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

  test("N=18 full-book composition — 18 distinct makers", async ({ page }) => {
    await page.goto("/preview/feed?n=18");
    await revealAll(page);
    await page.screenshot({
      path: "e2e/__screenshots__/feed-magazine-n18.png",
      fullPage: true,
    });
  });

  test("mobile composition — the zig-zag left edge", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/preview/feed?n=18");
    await revealAll(page);
    await page.screenshot({
      path: "e2e/__screenshots__/feed-magazine-mobile.png",
      fullPage: true,
    });
  });
});

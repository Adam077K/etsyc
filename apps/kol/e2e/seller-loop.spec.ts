import { expect, test } from "@playwright/test";
import { resetState } from "./helpers";

/**
 * The seller → buyer seam, which is the whole thesis: what Sena arranges in
 * /sell/edit is what a buyer opens at /m/sena, and nothing goes live until
 * she personally clears the publish gate.
 *
 * The theme assertion reads the COMPUTED `--ground` off the world root
 * (`.kol-world`) rather than a screenshot — the override is delivered as a
 * CSS variable on exactly that element, so that is the honest check.
 */

const GROUND = "#E6DCC7";

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("a hex typed in the editor is the ground a buyer's world paints", async ({ page }) => {
  await page.goto("/sell/edit");

  const hexInput = page.getByLabel("Ground hex value");
  await expect(hexInput).toBeVisible();
  await hexInput.fill(GROUND);
  await expect(hexInput).toHaveValue(GROUND);

  // the AA gate is arithmetic, not taste — this hex must still clear it
  await expect(page.getByText(/AA passes/i)).toBeVisible();

  await page.goto("/m/sena");
  const world = page.locator(".kol-world");
  await expect(world).toBeVisible();

  const ground = await world.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--ground").trim(),
  );
  expect(ground.toUpperCase()).toBe(GROUND);
});

test("publish is genuinely locked until every block is approved, then genuinely opens", async ({
  page,
}) => {
  await page.goto("/sell/publish");

  const publishButton = page.getByRole("button", { name: /Publish your world/i });
  await expect(publishButton).toBeVisible();
  await expect(publishButton).toBeDisabled();
  await expect(page.getByText("BLOCKED")).toBeVisible();

  /* ---------- approve everything that can be approved ---------- */
  const approveButtons = page.getByRole("button", {
    name: /Open & approve|Re-read & approve again/i,
  });
  const pending = await approveButtons.count();
  expect(pending, "seed state should start with unapproved blocks").toBeGreaterThan(0);

  for (let i = 0; i < pending; i++) {
    await approveButtons.first().click();
  }
  await expect(approveButtons).toHaveCount(0);

  /* ---------- the gate opens ---------- */
  await expect(page.getByText("OPEN")).toBeVisible();
  await expect(publishButton).toBeEnabled();

  await publishButton.click();
  await expect(page.getByText(/✓ Published/)).toBeVisible();

  /* ---------- and the buyer-facing world says so ---------- */
  await page.goto("/m/sena");
  await expect(page.getByText(/Published/).first()).toBeVisible();
  await expect(page.getByText(/Draft — not yet published/)).toHaveCount(0);
});

test("before she publishes, the buyer-facing world is honest about being a draft", async ({
  page,
}) => {
  await page.goto("/sell/edit"); // seeds the draft state
  await page.goto("/m/sena");
  await expect(page.getByText(/Draft — not yet published/)).toBeVisible();
});

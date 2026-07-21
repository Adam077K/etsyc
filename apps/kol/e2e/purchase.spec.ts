import { expect, test } from "@playwright/test";
import { parseMoney, resetState } from "./helpers";

/**
 * The purchase loop, end to end: product → cart → checkout → a REAL new
 * order, then the maker moving that order and the buyer seeing it move.
 *
 * The seeded order o-1041 is the trap here — a "successful" checkout that
 * lands back on the seed proves nothing, so the new id is asserted to be
 * different and the total is asserted against what was actually bought.
 */

const RIDGE_TUMBLER_MINOR = 6_800; // $68.00, from the seed catalogue

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("buying creates a new order, empties the cart, and tops the orders list", async ({
  page,
}) => {
  /* ---------- add to cart ---------- */
  await page.goto("/m/sena/p/ridge-tumbler");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.getByRole("link", { name: /view cart/i })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /Ridge tumbler/i })).toBeVisible();
  const cartTotal = parseMoney(
    await page.locator("section").filter({ hasText: "Summary" }).last().innerText(),
  );
  expect(cartTotal).toBe(RIDGE_TUMBLER_MINOR);

  /* ---------- checkout ---------- */
  await page.getByRole("link", { name: /Continue to checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText(/Stripe TEST MODE/i)).toBeVisible();

  await page.getByRole("button", { name: /Place order/i }).click();

  /* ---------- a genuinely new order ---------- */
  await expect(page).toHaveURL(/\/orders\/o-[^/?]+\?placed=1$/);
  const orderId = new URL(page.url()).pathname.split("/").pop() as string;
  expect(orderId, "checkout re-used the seeded order instead of creating one").not.toBe(
    "o-1041",
  );

  await expect(page.getByText(new RegExp(`Order #${orderId}`))).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ridge tumbler/i })).toBeVisible();
  expect(parseMoney(await page.locator("body").innerText())).toBe(RIDGE_TUMBLER_MINOR);

  /* ---------- cart is cleared ---------- */
  await page.goto("/cart");
  await expect(page.getByText(/Your cart is quiet/i)).toBeVisible();

  /* ---------- it leads the orders list, above the seeded one ---------- */
  await page.goto("/orders");
  const orderCards = page.getByRole("link", { name: /Sena/ });
  await expect(orderCards.first()).toContainText(`#${orderId}`);
  await expect(orderCards.first()).toContainText("$68.00");
  await expect(page.getByText("#o-1041")).toBeVisible(); // the seed is still there, below
});

test("a maker advancing an order shows up on the buyer's timeline", async ({ page }) => {
  /* ---------- buy something ---------- */
  await page.goto("/m/sena/p/ridge-tumbler");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: /Place order/i }).click();
  await expect(page).toHaveURL(/\/orders\/o-[^/?]+\?placed=1$/);
  const orderId = new URL(page.url()).pathname.split("/").pop() as string;

  // a fresh order starts at "Accepted"
  await expect(
    page.getByRole("listitem").filter({ hasText: "Accepted" }),
  ).toContainText("now");

  /* ---------- the maker moves it ---------- */
  await page.goto("/sell/dashboard");
  const statusSelect = page.getByLabel(`Set status for order ${orderId}`);
  await expect(statusSelect).toBeVisible();
  await expect(statusSelect).toHaveValue("accepted");
  await statusSelect.selectOption("in-production");
  await expect(statusSelect).toHaveValue("in-production");

  /* ---------- the buyer sees it ---------- */
  await page.goto(`/orders/${orderId}`);
  await expect(
    page.getByRole("listitem").filter({ hasText: "In production" }),
  ).toContainText("now");
  await expect(
    page.getByRole("listitem").filter({ hasText: "Accepted" }),
  ).not.toContainText("now");

  /* ---------- and it survives a reload (persisted, not in-memory) ---------- */
  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: "In production" }),
  ).toContainText("now");
});

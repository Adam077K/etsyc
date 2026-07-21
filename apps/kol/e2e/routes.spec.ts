import { expect, test, type Page } from "@playwright/test";
import { resetState } from "./helpers";

/**
 * Route coverage — every route in the app answers 200 and renders real
 * content, and every guarded route refuses the things it is supposed to
 * refuse. This is the floor the rest of the suite stands on: if a route
 * throws on mount, no behavioural spec below can be trusted.
 */

/** Every reachable route, dynamic ones instantiated with seed ids. */
const ROUTES: string[] = [
  // chrome / buyer surfaces
  "/",
  "/for-you",
  "/search",
  "/cart",
  "/checkout",
  "/inbox",
  "/notifications",
  "/orders",
  "/me",
  "/me/collections",
  "/me/reviews",
  "/settings",
  "/welcome",
  "/preview",
  // maker worlds — two fixture worlds, three honest stubs
  "/m/sena",
  "/m/noor",
  "/m/tomas",
  "/m/mira",
  "/m/elias",
  // products — db id space AND store-config fixture id space
  "/m/sena/p/ridge-tumbler",
  "/m/sena/p/p_ridge_tumbler",
  "/m/sena/p/ash-bowl",
  "/m/noor/p/shibori-throw",
  // world sub-surfaces
  "/m/sena/community",
  "/m/noor/community",
  "/m/noor/create",
  "/m/sena/live",
  // deep-linked records
  "/orders/o-1041",
  "/inbox/t-quilt",
  "/c/c-9f3k2m8q",
  // seller pipeline
  "/sell",
  "/sell/dashboard",
  "/sell/draft",
  "/sell/edit",
  "/sell/interview",
  "/sell/products",
  "/sell/publish",
  "/sell/verify",
  "/sell/voice",
];

/** Dev-mode Next renders runtime errors into a <nextjs-portal> overlay. */
async function assertNoErrorOverlay(page: Page): Promise<void> {
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/Unhandled Runtime Error|Application error|call stack/i);
}

test.describe("every route renders", () => {
  for (const route of ROUTES) {
    test(`GET ${route} → 200 and real content`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response, `no response for ${route}`).not.toBeNull();
      expect(response?.status(), `status for ${route}`).toBe(200);

      // the client-rendered body has to actually paint something
      await expect(page.locator("body")).not.toBeEmpty();
      const text = await page.locator("body").innerText();
      expect(text.trim().length, `body text length for ${route}`).toBeGreaterThan(120);

      await assertNoErrorOverlay(page);
    });
  }
});

test.describe("guards", () => {
  const NOT_FOUND: { route: string; why: string }[] = [
    { route: "/m/nobody", why: "unknown maker slug" },
    { route: "/m/noor/p/nothing", why: "unknown product id" },
    { route: "/inbox/nope", why: "unknown thread id" },
    // security contract: a PRIVATE collection must not be readable by slug
    { route: "/c/c-2b7d0x1p", why: "private collection" },
  ];

  for (const { route, why } of NOT_FOUND) {
    test(`${route} 404s (${why})`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `status for ${route}`).toBe(404);
      await expect(page.getByText(/could not be found|404/i).first()).toBeVisible();
    });
  }

  test("/c/c-9f3k2m8q — the public collection is still readable", async ({ page }) => {
    const response = await page.goto("/c/c-9f3k2m8q");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Slow textiles").first()).toBeVisible();
  });

  test("a product cannot be read through the wrong maker's world", async ({ page }) => {
    // shibori-throw belongs to noor; sena must not be able to host it
    const response = await page.goto("/m/sena/p/shibori-throw");
    expect(response?.status()).toBe(404);
  });

  test("/orders/o-9999 refuses to render a stranger's order", async ({ page }) => {
    await resetState(page);
    await page.goto("/orders/o-9999");
    // The route is a client component, so it renders its own honest
    // not-found state rather than a 404 (see the bug note in the report).
    await expect(page.getByText(/couldn.t find that order/i)).toBeVisible();
    await expect(page.getByText(/Ridge tumbler/i)).toHaveCount(0);
  });
});

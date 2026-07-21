import { expect, type Page } from "@playwright/test";

/**
 * The two localStorage keys the prototype persists everything through.
 * Clearing both is what makes each spec order-free: the session provider
 * falls back to DEFAULTS and the store provider falls back to SEED.
 */
export const SESSION_KEY = "kol-mvp-session-v1";
export const STORE_KEY = "kol-prototype-state-v1";

/**
 * Land on the app once, wipe both persisted keys, then hand back a page
 * whose next navigation starts from the seed. Playwright already isolates
 * contexts per test; this makes the guarantee explicit and survives anyone
 * later reusing a context.
 */
export async function resetState(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ([session, store]) => {
      window.localStorage.removeItem(session as string);
      window.localStorage.removeItem(store as string);
    },
    [SESSION_KEY, STORE_KEY],
  );
}

/** Parse the hero film's `m:ss` clock into seconds. */
export function parseClock(text: string): number {
  const match = /(\d+):(\d{2})/.exec(text);
  if (!match) throw new Error(`no m:ss clock found in: ${text}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Read the persistent hero film's elapsed seconds. */
export async function heroElapsed(page: Page): Promise<number> {
  const hero = page.locator("[data-hero-stage]");
  await expect(hero).toBeVisible();
  return parseClock(await hero.innerText());
}

/** Money strings in the app are `$1,234.56` — compare as minor units. */
export function parseMoney(text: string): number {
  const match = /\$([\d,]+\.\d{2})/.exec(text);
  if (!match) throw new Error(`no price found in: ${text}`);
  return Math.round(Number((match[1] as string).replace(/,/g, "")) * 100);
}

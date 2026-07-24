import { chromium } from "@playwright/test";

/** Keyboard-only walk through the capture ritual. Proves the recurring
 *  regression class: focus lands on the live action at each state, Esc behaves
 *  (cut while rolling, leave otherwise), and — on exit — focus is RESTORED to
 *  the invoking control (or its equivalent after a slot→filmed re-render). */
const base = process.env.SHOOT_BASE ?? "http://localhost:3013";
const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1440, height: 900 } }).then((c) => c.newPage());
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const label = () =>
  page.evaluate(() => document.activeElement?.textContent?.trim().replace(/\s+/g, " ") ?? "(none)");
const dialog = () => page.locator('[role="dialog"]');
let fail = 0;
const check = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) fail++; };

await page.goto(`${base}/sell/clips`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// ---- Run 1: open, walk the states, ESC from framing → focus RESTORED to invoker.
const trigger = page.getByRole("button", { name: /Step into the frame/i }).first();
await trigger.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(500);
check(await dialog().isVisible(), "ritual opens");
check(/Start rolling/i.test(await label()), "focus lands on Start rolling");

await page.keyboard.press("Enter");
await page.waitForTimeout(600);
check(/Cut/i.test(await label()), "focus lands on Cut while rolling");

await page.keyboard.press("Escape"); // Esc while rolling → cut to review
await page.waitForTimeout(500);
check(await dialog().isVisible(), "Esc while rolling keeps the ritual open (cuts to review)");
check(/Keep this take/i.test(await label()), "focus lands on Keep this take in review");

await page.keyboard.press("Tab");
check(/Film again/i.test(await label()), "Tab reaches Film again");
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
check(/Start rolling/i.test(await label()), "Film again returns to framing (focus on Start rolling)");

await page.keyboard.press("Escape"); // Esc from framing → leave
await page.waitForTimeout(400);
check(!(await dialog().isVisible()), "Esc from framing closes the ritual");
check(/Step into the frame/i.test(await label()), "focus RESTORED to the invoking control after abandon");

// ---- Run 2: open a specific un-filmed slot, KEEP a take → card becomes filmed;
//      focus must land on the equivalent control (its 'Film another take').
const target = page.locator('[data-shot-trigger="process-centre"]');
await target.scrollIntoViewIfNeeded();
await target.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Start rolling/i }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: /^Cut$/i }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Keep this take/i }).click();
await page.waitForTimeout(1600);
check(!(await dialog().isVisible()), "ritual closes after keeping the take");
const restored = await page.evaluate(() =>
  document.activeElement?.getAttribute("data-shot-trigger"),
);
check(restored === "process-centre", "focus RESTORED to the equivalent control after slot→filmed re-render");

check(errors.length === 0, `no console errors (${errors.join("; ")})`);
console.log(fail ? `\n${fail} FAILURE(S)` : "\nALL PASS");
await browser.close();
process.exit(fail ? 1 : 0);

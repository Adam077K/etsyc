const { chromium } = await import("@playwright/test");
const BASE = "http://localhost:3210";
const browser = await chromium.launch();

const lum = (c) => { const f=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
const ratio = (a,b)=>{const l1=lum(a),l2=lum(b);const hi=Math.max(l1,l2),lo=Math.min(l1,l2);return Math.round(((hi+0.05)/(lo+0.05))*100)/100;};

// --- 1. explicit contrast probe of the muted/NN opacity cases
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  for (const [url, sel, label] of [
    ["/m/sena/community", "button.text-muted\\/70", "community Hide btn (text-muted/70)"],
    ["/m/sena/live", "p.text-muted\\/80", "live empty-state body (text-muted/80)"],
    ["/notifications", "span.text-muted\\/80", "notifications type caption (text-muted/80)"],
  ]) {
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    const r = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cs = getComputedStyle(el);
      // Paint each colour onto an opaque white-then-backdrop canvas so ANY
      // colour syntax (color-mix, oklab, rgb / a) resolves to real sRGB bytes.
      const cv = document.createElement("canvas");
      cv.width = cv.height = 8;
      const g = cv.getContext("2d", { willReadFrequently: true });
      const paint = (under, over) => {
        g.clearRect(0, 0, 8, 8);
        g.fillStyle = under; g.fillRect(0, 0, 8, 8);
        if (over) { g.fillStyle = over; g.fillRect(0, 0, 8, 8); }
        const d = g.getImageData(4, 4, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      // walk up for the nearest painted backdrop, stacking translucent layers
      const stack = [];
      let cur = el;
      while (cur) { const b = getComputedStyle(cur).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)" && b !== "transparent") stack.unshift(b); cur = cur.parentElement; }
      g.clearRect(0, 0, 8, 8);
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, 8, 8);
      for (const b of stack) { g.fillStyle = b; g.fillRect(0, 0, 8, 8); }
      const bgPix = g.getImageData(4, 4, 1, 1).data;
      const bg = [bgPix[0], bgPix[1], bgPix[2]];
      const fg = paint(`rgb(${bg[0]},${bg[1]},${bg[2]})`, cs.color);
      return { color: cs.color, fg, bg, size: cs.fontSize, weight: cs.fontWeight };
    }, sel);
    if (!r) { console.log(`${label}: NOT FOUND`); continue; }
    const px = parseFloat(r.size), wt = Number(r.weight) || 400;
    const need = px >= 24 || (px >= 18.66 && wt >= 700) ? 3 : 4.5;
    const cr = ratio(r.fg, r.bg);
    console.log(`${label}: ${r.color} @${r.size}/${r.weight} fg=rgb(${r.fg}) on rgb(${r.bg}) => ${cr}:1 (need ${need}) ${cr < need ? "*** FAIL ***" : "pass"}`);
  }
  await ctx.close();
}

// --- 2. hero narration dock visibility on mobile (HeroPlayer — report only)
{
  for (const w of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator('a[aria-label^="Play"]').first().click();
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const hits = [];
      for (const el of document.querySelectorAll("body *")) {
        const t = (el.innerText || "").trim();
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (/narrat|transcript|caption|what .*hearing|subtitle/i.test(el.className + " " + (el.getAttribute("aria-label") || ""))) {
          hits.push({ src: "classname", cls: el.className.toString().slice(0, 80), w: Math.round(rect.width), h: Math.round(rect.height), disp: cs.display });
        }
      }
      // find any element hidden specifically at this breakpoint inside the hero overlay
      const fixedEls = [...document.querySelectorAll("body *")].filter(e => getComputedStyle(e).position === "fixed" && e.getBoundingClientRect().width > 100);
      const hiddenMd = [...document.querySelectorAll('[class*="hidden"][class*="md:"]')].map(e => ({
        cls: e.className.toString().slice(0, 110),
        visible: e.getBoundingClientRect().height > 0,
        text: (e.innerText || "").trim().slice(0, 70),
      }));
      return { hits, fixedCount: fixedEls.length, fixedTexts: fixedEls.map(e => (e.innerText||"").trim().slice(0,80)), hiddenMd };
    });
    console.log(`\n--- hero @${w}px: fixed overlays=${r.fixedCount}`);
    console.log("   fixed text:", JSON.stringify(r.fixedTexts).slice(0, 400));
    console.log("   hidden-at-breakpoint els:", JSON.stringify(r.hiddenMd).slice(0, 900));
    await ctx.close();
  }
}

// --- 3. inbox two-pane at 768
{
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/inbox", { waitUntil: "networkidle" });
  const r = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    vw: document.documentElement.clientWidth,
    panes: [...document.querySelectorAll("main > div > *")].map(e => ({ tag: e.tagName, w: Math.round(e.getBoundingClientRect().width) })),
  }));
  console.log("\n--- inbox @768:", JSON.stringify(r));
  await ctx.close();
}
await browser.close();

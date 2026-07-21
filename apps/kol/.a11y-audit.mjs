const { chromium } = await import(
  "@playwright/test"
);

const BASE = "http://localhost:3210";
const PAGES = [
  "/", "/for-you", "/search", "/cart", "/checkout", "/orders",
  "/inbox", "/notifications", "/me", "/me/collections", "/me/reviews",
  "/welcome", "/settings", "/m/sena/community", "/m/sena/create", "/m/sena/live",
];
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

const AUDIT = () => {
  const out = { overflow: [], tap: [], name: [], label: [], heading: [], alt: [], clickdiv: [], contrast: [], fixed: [] };
  const vw = document.documentElement.clientWidth;

  // ---- 1. horizontal overflow
  if (document.documentElement.scrollWidth > vw + 1) {
    out.overflow.push({ doc: true, scrollWidth: document.documentElement.scrollWidth, vw });
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed") continue;
        // only report if parent does not already scroll it
        let p = el.parentElement, scrolled = false;
        while (p && p !== document.body) {
          const pcs = getComputedStyle(p);
          if (pcs.overflowX === "auto" || pcs.overflowX === "scroll" || pcs.overflowX === "hidden") { scrolled = true; break; }
          p = p.parentElement;
        }
        if (scrolled) continue;
        out.overflow.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 120),
          text: (el.textContent || "").trim().slice(0, 60),
          left: Math.round(r.left), right: Math.round(r.right),
        });
      }
    }
  }

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };

  const accName = (el) => {
    const al = el.getAttribute("aria-label");
    if (al && al.trim()) return al.trim();
    const lb = el.getAttribute("aria-labelledby");
    if (lb) {
      const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
      if (t) return t;
    }
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l && l.textContent.trim()) return l.textContent.trim();
    }
    if (el.closest("label")) {
      const t = el.closest("label").textContent.trim();
      if (t) return t;
    }
    const title = el.getAttribute("title");
    if (title && title.trim()) return title.trim();
    if (el.tagName === "INPUT" && ["submit", "button", "reset"].includes(el.type)) return el.value || "";
    const txt = (el.innerText || el.textContent || "").trim();
    if (txt) return txt;
    const img = el.querySelector("img[alt]");
    if (img && img.alt.trim()) return img.alt.trim();
    return "";
  };

  const desc = (el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.className || "").toString().slice(0, 100),
    text: (el.innerText || el.textContent || "").trim().slice(0, 50),
    html: el.outerHTML.slice(0, 130),
  });

  // ---- 2. tap targets (interactive, visible)
  for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=radio], [role=checkbox]")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 44 || r.width < 24) {
      out.tap.push({ ...desc(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }

  // ---- 3. accessible names on interactive elements
  for (const el of document.querySelectorAll("a[href], button, [role=button], [role=tab], [role=radio]")) {
    if (!visible(el)) continue;
    if (!accName(el)) out.name.push(desc(el));
  }

  // ---- 4. form controls without label
  for (const el of document.querySelectorAll("input:not([type=hidden]), select, textarea")) {
    if (!visible(el)) continue;
    if (!accName(el)) out.label.push(desc(el));
  }
  // orphan labels (label with `for` pointing at nothing, no wrapped control)
  for (const l of document.querySelectorAll("label[for]")) {
    const target = document.getElementById(l.getAttribute("for"));
    if (!target) out.label.push({ orphanLabel: l.getAttribute("for"), text: l.textContent.trim().slice(0, 60) });
  }

  // ---- 5. heading order
  let prev = 0;
  for (const h of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    if (!visible(h)) continue;
    const lvl = Number(h.tagName[1]);
    if (prev && lvl > prev + 1) out.heading.push({ from: prev, to: lvl, text: h.textContent.trim().slice(0, 60) });
    prev = lvl;
  }

  // ---- 6. images without alt
  for (const img of document.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) out.alt.push({ src: (img.src || "").slice(0, 80) });
  }

  // ---- 7. non-semantic clickable elements
  for (const el of document.querySelectorAll("div[onclick], span[onclick]")) {
    out.clickdiv.push(desc(el));
  }

  // ---- 8. fixed/sticky elements that may cover content
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed") continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 1000) continue;
    out.fixed.push({ ...desc(el), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], z: cs.zIndex });
  }

  // ---- 9. contrast (text nodes, resolved against painted backdrop)
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
  const bgOf = (el) => {
    let cur = el, acc = null;
    while (cur) {
      const cs = getComputedStyle(cur);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null; // gradient/film — skip
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { acc = acc ? over(acc, c) : c; if (acc.a >= 1 || c.a >= 1) return acc.a >= 1 ? acc : over(acc, { r: 255, g: 255, b: 255, a: 1 }); }
      cur = cur.parentElement;
    }
    return acc || { r: 255, g: 255, b: 255, a: 1 };
  };

  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color);
    if (!fg0) continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const fg = fg0.a < 1 ? over(fg0, bg) : fg0;
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const cr = ratio(fg, bg);
    if (cr < need) {
      const key = `${cs.color}|${size}|${(el.className || "").toString().slice(0, 60)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.contrast.push({
        ratio: Math.round(cr * 100) / 100, need, size, weight,
        color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
        cls: (el.className || "").toString().slice(0, 100),
        text: (el.textContent || "").trim().slice(0, 50),
      });
    }
  }
  return out;
};

const only = process.argv[2];
const vpFilter = process.argv[3];
const browser = await chromium.launch();
const results = {};
for (const vp of VIEWPORTS) {
  if (vpFilter && vp.name !== vpFilter) continue;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    if (only && only !== "all" && p !== only) continue;
    try {
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(600);
      const r = await page.evaluate(AUDIT);
      const nonEmpty = Object.fromEntries(Object.entries(r).filter(([, v]) => v.length));
      if (Object.keys(nonEmpty).length) results[`${vp.name} ${p}`] = nonEmpty;
    } catch (e) {
      results[`${vp.name} ${p}`] = { ERROR: String(e).slice(0, 200) };
    }
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 1));

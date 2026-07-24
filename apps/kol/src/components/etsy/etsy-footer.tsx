/**
 * Etsy-register footer + the required honesty line. We are demoing TO Etsy, so
 * the page recreates their visual language but never claims to be them.
 */
const FOOTER_COLS = [
  { title: "Shop", links: ["Gift cards", "Etsy Registry", "Sitemap", "Etsy blog"] },
  { title: "Sell", links: ["Sell on Etsy", "Teams", "Forums", "Affiliates"] },
  { title: "About", links: ["Etsy, Inc.", "Policies", "Investors", "Careers"] },
  { title: "Help", links: ["Help Centre", "Privacy", "Terms of Use", "Region"] },
];

export function EtsyFooter() {
  return (
    <footer className="mt-8 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        {FOOTER_COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold text-neutral-900">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <span className="cursor-default text-sm text-neutral-500 hover:text-neutral-800 hover:underline">
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span
            className="text-lg font-bold lowercase text-[#F1641E]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Etsy
          </span>
          {/* HONESTY LINE — unobtrusive but present. */}
          <span className="max-w-xl text-neutral-500">
            Concept demo for the HLV × Etsy program — not an Etsy property. Products,
            makers and imagery are KOL&rsquo;s own demo content.
          </span>
        </div>
      </div>
    </footer>
  );
}

import { SealCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { Maker } from "@/lib/fixtures/makers";
import { trustLayers } from "@/lib/fixtures/commerce";

/**
 * Trust badge (concept-lock D7) — KOL's honest two-layer proof, a fixed system
 * element rendered in the locked palette (never maker-accented). Layer 1:
 * Real-Maker, verified human anchored by their own voice on film. Layer 2:
 * AI-Transparency, an honest disclosure of where AI assisted. Every claim here
 * is one the product can actually back in v1.
 */
export function TrustBadge({ maker }: { maker: Maker }) {
  const { realMaker, aiTransparency } = trustLayers(maker);
  return (
    <section
      aria-label="KOL trust and transparency"
      className="overflow-hidden rounded-3xl border border-line bg-ink-soft"
    >
      <p className="meta border-b border-line px-6 py-3.5 text-bone-dim">
        KOL verified · two honest layers
      </p>
      <ul className="divide-y divide-line">
        <TrustRow
          icon={<SealCheck size={22} weight="fill" className="text-marigold" />}
          title={realMaker.title}
          body={realMaker.body}
        />
        <TrustRow
          icon={<Sparkle size={22} weight="fill" className="text-sky" />}
          title={aiTransparency.title}
          body={aiTransparency.body}
        />
      </ul>
    </section>
  );
}

function TrustRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4 px-6 py-5">
      <span
        aria-hidden
        className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink ring-1 ring-line"
      >
        {icon}
      </span>
      <div>
        <p className="font-ui text-[0.95rem] font-semibold text-bone">{title}</p>
        <p className="mt-1 font-ui text-sm leading-relaxed text-bone-dim">{body}</p>
      </div>
    </li>
  );
}

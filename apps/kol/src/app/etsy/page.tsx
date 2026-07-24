import type { Metadata } from "next";
import { EtsyHome } from "@/components/etsy/etsy-home";

/**
 * /etsy — concept demo entry point for the HLV × Etsy program. Recreates the
 * Etsy marketplace home in its own light register, populated with KOL's own
 * makers' products, and hands off into the KOL film feed (`/`). This route is
 * DELIBERATELY exempt from the KOL design contract (DESIGN.md); it is not an
 * Etsy property (see the honesty line in the footer).
 */
export const metadata: Metadata = {
  title: "Etsy — concept demo (HLV × Etsy)",
  description:
    "A concept recreation of the Etsy marketplace, entered into the KOL film feed. Not an Etsy property.",
  robots: { index: false, follow: false },
};

export default function EtsyConceptPage() {
  return <EtsyHome />;
}

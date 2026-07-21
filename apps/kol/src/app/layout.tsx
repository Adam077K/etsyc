import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Fraunces,
  Geist_Mono,
  JetBrains_Mono,
  Space_Mono,
} from "next/font/google";
import "./globals.css";
import { KolSessionProvider } from "@/lib/mock/session";
import { KolStoreProvider } from "@/lib/mock/store";
import { HeroPlayerProvider } from "@/components/chrome/HeroPlayer";
import { Nav } from "@/components/chrome/Nav";

/**
 * Font loading for the 4 curated pairings (design-system §3 — no Inter,
 * anywhere). Google faces load via next/font (self-hosted at build);
 * Fontshare faces (Clash Display, General Sans, Satoshi, Cabinet Grotesk)
 * load via Fontshare's hosted CSS below — next/font/local needs the font
 * binaries vendored, which is a Phase-5 asset task.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const FONTSHARE_CSS =
  "https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=general-sans@400,500,600,700&f[]=satoshi@400,500,700&f[]=cabinet-grotesk@500,700,800&display=swap";

export const metadata: Metadata = {
  title: "KOL — meet the maker",
  description:
    "A video-native marketplace where every shop is a maker's world — real people on film, not a product grid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${bricolage.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${spaceMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTSHARE_CSS} />
      </head>
      <body>
        <KolSessionProvider>
          <KolStoreProvider>
            {/* HeroPlayer lives ABOVE the router so the maker's film
                survives every route change (P4: never unmounts, never pauses) */}
            <HeroPlayerProvider>
              <Nav />
              {children}
            </HeroPlayerProvider>
          </KolStoreProvider>
        </KolSessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Young_Serif,
  Hanken_Grotesk,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";
import { FilmProvider } from "@/components/film/film-context";
import { FilmStage } from "@/components/film/film-stage";
import { FilmRouteSync } from "@/components/film/film-route-sync";

// The loud voice — Kotn-scale statement display.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Editorial warmth — wordmark, pull-quotes, issue framing.
const serif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

// The workhorse — UI, body, labels.
const ui = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

// The colophon voice — masthead data + meta.
const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KOL — The Maker's Issue",
  description:
    "A magazine of real makers, on film. Meet the human, then buy from them — never a product grid.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${ui.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-ink text-bone">
        {/* The continuous film layer lives in the app shell so the maker's film
            is never re-mounted from black across the buyer routes. */}
        <FilmProvider>
          <FilmRouteSync />
          <FilmStage />
          {children}
        </FilmProvider>
      </body>
    </html>
  );
}

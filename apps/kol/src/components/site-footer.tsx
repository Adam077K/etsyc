"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, InstagramLogo, YoutubeLogo, EnvelopeSimple } from "@phosphor-icons/react";
import { rise, calm } from "@/lib/motion";
import { Magnetic } from "./magnetic";

const COLUMNS = [
  { title: "Shop", links: ["The issue", "By craft", "New makers", "Gift guide"] },
  { title: "Makers", links: ["Sell on KOL", "How it works", "Maker stories", "Apply"] },
  { title: "KOL", links: ["About", "The Journal", "Trust & proof", "Careers"] },
];

export function SiteFooter() {
  const reduce = useReducedMotion();
  const v = reduce ? calm : rise(28, 0.9);

  return (
    <footer className="border-t border-line bg-ink">
      {/* Closing statement + join. */}
      <motion.div
        variants={v}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-issue px-5 py-20 sm:px-8 sm:py-28"
      >
        <p className="meta text-marigold">Next issue, in your inbox</p>
        <h2
          className="mt-6 max-w-4xl font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
        >
          Meet the maker
          <br />
          before the thing.
        </h2>

        <form
          className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="sr-only" htmlFor="join-email">
            Email address
          </label>
          <div className="flex flex-1 items-center gap-3 rounded-full border border-bone/25 bg-ink-soft px-5 py-3.5 transition-colors focus-within:border-bone/60">
            <EnvelopeSimple size={20} className="shrink-0 text-bone/50" />
            <input
              id="join-email"
              type="email"
              required
              placeholder="you@example.com"
              suppressHydrationWarning
              className="w-full bg-transparent font-ui text-base text-bone placeholder:text-bone/40 focus:outline-none"
            />
          </div>
          <Magnetic strength={0.25}>
            <button
              type="submit"
              className="group flex items-center justify-center gap-2 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright"
            >
              Get the issue
              <ArrowRight
                size={19}
                weight="bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </Magnetic>
        </form>
      </motion.div>

      {/* Colophon. */}
      <div className="border-t border-line">
        <div className="mx-auto grid max-w-issue gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-3xl leading-none text-bone">KOL</p>
            <p className="mt-4 max-w-xs font-ui text-sm leading-relaxed text-bone/60">
              A video-native marketplace of real makers. Shopping, back to a
              relationship.
            </p>
            <div className="mt-6 flex gap-2">
              {[InstagramLogo, YoutubeLogo].map((Icon, i) => (
                <a
                  key={i}
                  href="#top"
                  aria-label="Social"
                  className="grid h-10 w-10 place-items-center rounded-full border border-bone/20 text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title}>
              <p className="meta text-bone-dim">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#top"
                      className="font-ui text-sm text-bone/70 transition-colors hover:text-bone"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mx-auto flex max-w-issue flex-col gap-2 px-5 pb-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="meta text-bone/45">Issue 07 · Summer · Printed on the web</p>
          <p className="meta text-bone/45">© 2026 KOL — demo content, real makers coming soon</p>
        </div>
      </div>
    </footer>
  );
}

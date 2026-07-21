"use client";

/**
 * KOL chrome nav (D15a — fixed design system, never maker-themed).
 * Mirrors the approved page-mockup nav 1:1. Unread state is a quiet
 * accent dot — never a red count badge (B16 AC).
 *
 * Below md the eight links drop to their own horizontally scrollable
 * rail so the row can never overflow a 375px viewport; from md up the
 * layout is the approved single row, unchanged. Every link and pill
 * carries a 44px hit box while the active underline still hugs the
 * text (the underline lives on an inner span, not the tall anchor).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKolSession } from "@/lib/mock/session";
import { notifications } from "@/lib/mock/db";

const LINKS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/", label: "Discover", match: (p) => p === "/" },
  { href: "/for-you", label: "For You", match: (p) => p.startsWith("/for-you") },
  { href: "/search", label: "Search", match: (p) => p.startsWith("/search") },
  { href: "/inbox", label: "Inbox", match: (p) => p.startsWith("/inbox") },
  { href: "/notifications", label: "Notifications", match: (p) => p.startsWith("/notifications") },
  {
    href: "/me/collections",
    label: "Saved",
    match: (p) => p.startsWith("/me/collections") || p.startsWith("/c/"),
  },
  { href: "/orders", label: "Orders", match: (p) => p.startsWith("/orders") },
  {
    href: "/me",
    label: "Profile",
    match: (p) => p === "/me" || p.startsWith("/me/reviews") || p.startsWith("/settings"),
  },
];

/** pill hit box shared by Cart / Sell / Sign in — 44px tall, pill-shaped */
const PILL =
  "inline-flex min-h-11 items-center rounded-pill px-4 text-caption transition-colors duration-state ease-kol";

function NavLink({
  href,
  label,
  active,
  unread,
}: {
  href: string;
  label: string;
  active: boolean;
  unread: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center text-caption uppercase transition-colors duration-state ease-kol ${
        active ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span
        className={`border-b-2 pb-0.5 ${active ? "border-accent" : "border-transparent"}`}
      >
        {label}
        {label === "Notifications" && unread ? (
          <span
            aria-label="unread"
            className="ml-1 inline-block h-1.5 w-1.5 rounded-pill bg-accent align-middle"
          />
        ) : null}
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname() ?? "/";
  const session = useKolSession();
  const unread = notifications.some((n) => !session.readNotifications.includes(n.id));
  const cartCount = session.cart.reduce((n, l) => n + l.qty, 0);

  const links = LINKS.map((l) => (
    <NavLink
      key={l.href}
      href={l.href}
      label={l.label}
      active={l.match(pathname)}
      unread={unread}
    />
  ));

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur-md">
      <div className="mx-auto max-w-page px-6 py-2 md:py-2.5">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="inline-flex min-h-11 shrink-0 items-center font-display text-2xl font-bold tracking-tight text-ink"
          >
            K<span className="text-accent">O</span>L
          </Link>

          {/* md+ : the approved single-row link set */}
          <div className="hidden flex-1 flex-wrap items-center gap-x-5 gap-y-1 md:flex">
            {links}
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link
              href="/cart"
              className={`${PILL} border border-line bg-surface text-ink hover:bg-ground`}
            >
              Cart{cartCount > 0 ? ` · ${cartCount}` : ""}
            </Link>
            <Link
              href="/sell"
              className={`${PILL} hidden border border-line bg-surface text-ink hover:bg-ground md:inline-flex`}
            >
              Sell on KOL
            </Link>
            <Link
              href="/welcome"
              className={`${PILL} bg-accent-cta font-semibold text-accent-ink transition-transform duration-tap active:scale-[0.98]`}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* below md : the same eight links on their own scroll rail */}
        <div className="-mx-6 overflow-x-auto px-6 md:hidden">
          <div className="flex min-w-max items-center gap-x-5">{links}</div>
        </div>
      </div>
    </nav>
  );
}

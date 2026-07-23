"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  EnvelopeSimple,
  WarningCircle,
  CircleNotch,
  Sparkle,
} from "@phosphor-icons/react";
import { rise, calm } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent";

/**
 * Sign in — KOL chrome, warm and calm (concept-lock D15: the fixed system, no
 * maker branding). A design-only mock: no password, no real auth, no real
 * email. The in-world framing is a "signed note" (magic link) with a designed
 * "check your post" success state. Demo-honest: the mock is labelled as such.
 */
export function SignIn() {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (status === "sending") return;
    const value = email.trim();
    if (!value) {
      setError("Add an email so we know where to send it.");
      inputRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("That email doesn’t look right.");
      inputRef.current?.focus();
      return;
    }
    setError(undefined);
    setStatus("sending");
    timer.current = setTimeout(() => setStatus("sent"), 900);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setStatus("idle");
    setError(undefined);
    setEmail("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Calm KOL chrome. */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 font-ui text-sm text-bone-dim transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <ArrowLeft
              size={17}
              weight="bold"
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back to the feed
          </Link>
          <Link href="/" className="font-serif text-2xl leading-none text-bone">
            KOL
          </Link>
          <span className="meta hidden text-bone-dim sm:inline">
            The&nbsp;Maker&#39;s&nbsp;Issue
          </span>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-issue lg:grid-cols-2">
        {/* Form / success panel. */}
        <div className="flex items-center px-5 py-16 sm:px-8 lg:px-16">
          <motion.div
            variants={reduce ? calm : rise(24, 0.7)}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md"
          >
            {status === "sent" ? (
              <Sent email={email.trim()} onReset={reset} />
            ) : (
              <>
                <p className="meta text-marigold">Sign in · or make your first visit</p>
                <h1
                  className="mt-5 font-display font-extrabold leading-[0.95] text-bone"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
                >
                  Come in.
                </h1>
                <p className="mt-5 max-w-sm font-serif text-lg italic leading-snug text-bone/75">
                  No passwords here. Tell us where to send a signed note, tap the
                  wax seal inside, and you&rsquo;re home.
                </p>

                <form onSubmit={onSubmit} noValidate className="mt-10">
                  <label
                    htmlFor="signin-email"
                    className="mb-1.5 block font-ui text-sm font-medium text-bone/80"
                  >
                    Email
                  </label>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl border bg-ink-soft px-4 py-3.5 transition-colors focus-within:ring-2 focus-within:ring-marigold/45",
                      error
                        ? "border-error"
                        : "border-bone/20 focus-within:border-marigold/70",
                    )}
                  >
                    <EnvelopeSimple size={19} className="shrink-0 text-bone/45" />
                    <input
                      id="signin-email"
                      ref={inputRef}
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(undefined);
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!error}
                      aria-describedby={error ? "signin-error" : undefined}
                      suppressHydrationWarning
                      className="w-full bg-transparent font-ui text-base text-bone placeholder:text-bone/40 focus:outline-none"
                    />
                  </div>
                  {error && (
                    <p
                      id="signin-error"
                      className="mt-1.5 flex items-center gap-1.5 font-ui text-xs text-error"
                    >
                      <WarningCircle size={13} weight="fill" />
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="group mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-marigold px-7 py-4 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {status === "sending" ? (
                      <>
                        <CircleNotch size={19} weight="bold" className="animate-spin" />
                        Sealing the envelope…
                      </>
                    ) : (
                      <>
                        Send me a signed note
                        <ArrowRight
                          size={19}
                          weight="bold"
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 max-w-sm font-ui text-sm leading-relaxed text-bone/55">
                  No account yet? The same note makes one — nothing to remember,
                  nothing to forget.
                </p>
                <p className="mt-8 flex items-center gap-2 font-ui text-xs text-bone-dim">
                  <Sparkle size={14} weight="fill" className="text-marigold/70" />
                  Demonstration only — no real email is sent.
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Editorial image panel. */}
        <aside className="relative hidden overflow-hidden lg:block">
          <div className={cn("absolute inset-0", reduce ? "" : "film-drift")}>
            <Image
              src="/media/clay-wheel.jpg"
              alt="A maker at the wheel, hands in wet clay"
              fill
              priority
              sizes="50vw"
              className="object-cover saturate-[0.95]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
          <div className="absolute inset-x-0 bottom-0 p-12">
            <blockquote
              className="max-w-md font-serif leading-[1.15] text-bone"
              style={{ fontSize: "clamp(1.75rem, 2.6vw, 2.75rem)" }}
            >
              &ldquo;Come in — the wheel is still turning.&rdquo;
            </blockquote>
            <p className="mt-5 font-ui text-sm text-bone/80">
              <span className="font-semibold text-bone">Lena Okafor</span> · Odd
              Clay Studio, Lisbon
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

/** "Check your post" — the designed success state. */
function Sent({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div>
      <span className="grid h-16 w-16 place-items-center rounded-full bg-marigold/12 text-marigold">
        <EnvelopeSimple size={30} weight="fill" />
      </span>
      <p className="meta mt-8 text-marigold">Note on its way</p>
      <h1
        className="mt-5 font-display font-extrabold leading-[0.95] text-bone"
        style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
      >
        Check your post.
      </h1>
      <p className="mt-5 max-w-sm font-serif text-lg italic leading-snug text-bone/75">
        We&rsquo;ve sent a signed note to{" "}
        <span className="not-italic font-ui font-semibold text-bone">{email}</span>.
        Open it and tap the wax seal to come in.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          onClick={onReset}
          className="rounded-full border border-bone/25 px-6 py-3 font-ui text-sm font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Use a different email
        </button>
        <Link
          href="/account"
          className="group flex items-center gap-2 rounded-full bg-marigold px-6 py-3 font-ui text-sm font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Preview the account
          <ArrowRight
            size={17}
            weight="bold"
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>

      <p className="mt-8 flex items-center gap-2 font-ui text-xs text-bone-dim">
        <Sparkle size={14} weight="fill" className="text-marigold/70" />
        Demonstration only — no real note was sent.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Info,
  ShieldCheck,
  ArrowRight,
  WarningCircle,
  CaretDown,
} from "@phosphor-icons/react";
import { resolveBag, bagTotals, gbp } from "@/lib/fixtures/commerce";
import type { Maker } from "@/lib/fixtures/makers";
import { rise, calm, stagger, inView } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useFilm } from "./film/film-context";
import { cornerTarget, dockAspect } from "./film/film-geometry";

const ERR = "text-error";
const NUM = ["", "One", "Two", "Three", "Four", "Five"];

type Fields =
  | "email"
  | "fullName"
  | "address1"
  | "city"
  | "postcode"
  | "country"
  | "cardName"
  | "cardNumber"
  | "expiry"
  | "cvc";

type Values = Record<Fields, string>;
type Errors = Partial<Record<Fields, string>>;

// Realistic demo defaults — the default state reads as a finished, filled form.
// The card fields are deliberately the visibly-fake test number.
const INITIAL: Values = {
  email: "you@example.com",
  fullName: "Alex Rivera",
  address1: "14 Ropewalk Lane",
  city: "Bristol",
  postcode: "BS1 4RN",
  country: "United Kingdom",
  cardName: "Alex Rivera",
  cardNumber: "4242 4242 4242 4242",
  expiry: "04 / 28",
  cvc: "123",
};

/**
 * Checkout — KOL-owned and on the fixed system (concept-lock D15: this surface
 * is KOL chrome, never maker-branded). Calm, trustworthy, system-toned — but the
 * human thread stays: each line says who made it, and the makers are present at
 * the foot of the summary. All states are designed, including the client-side
 * validation-error state. No real payment: the card form is a visibly-labelled
 * demo and does not imitate any real payment brand.
 */
export function Checkout() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const lines = resolveBag();
  const totals = bagTotals(lines);
  const makers = Array.from(new Map(lines.map((l) => [l.maker.id, l.maker])).values());

  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const set = (field: Fields) => (v: string) => {
    setValues((prev) => ({ ...prev, [field]: v }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  function validate(v: Values): Errors {
    const e: Errors = {};
    if (!v.email.trim()) e.email = "Add an email for your receipt.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
      e.email = "That email doesn't look right.";
    if (!v.fullName.trim()) e.fullName = "Who should we address it to?";
    if (!v.address1.trim()) e.address1 = "Add a street address.";
    if (!v.city.trim()) e.city = "Add a town or city.";
    if (!v.postcode.trim()) e.postcode = "Add a postcode.";
    if (!v.country.trim()) e.country = "Choose a country.";
    if (!v.cardName.trim()) e.cardName = "Add the name on the card.";
    const digits = v.cardNumber.replace(/\s/g, "");
    if (!digits) e.cardNumber = "Add a card number.";
    else if (!/^\d{15,16}$/.test(digits)) e.cardNumber = "Enter a 15- or 16-digit card number.";
    if (!v.expiry.trim()) e.expiry = "Add an expiry date.";
    else if (!/^\d{2}\s?\/\s?\d{2}$/.test(v.expiry.trim())) e.expiry = "Use MM / YY.";
    const cvc = v.cvc.trim();
    if (!cvc) e.cvc = "Add the CVC.";
    else if (!/^\d{3,4}$/.test(cvc)) e.cvc = "3 or 4 digits.";
    return e;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0] as Fields | undefined;
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    router.push("/thank-you");
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* The maker stays present through checkout — the continuous film docks in
          the corner (never re-mounted from black between product and here). */}
      {makers[0] && <CheckoutFilm maker={makers[0]} reduce={!!reduce} />}
      {/* KOL chrome — deliberately plain and trustworthy. */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 font-ui text-sm text-bone-dim transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <ArrowLeft size={17} weight="bold" className="transition-transform group-hover:-translate-x-0.5" />
            Keep browsing
          </Link>
          <Link href="/" className="font-serif text-2xl leading-none text-bone">
            KOL
          </Link>
          <span className="flex items-center gap-1.5 font-ui text-sm text-bone-dim">
            <Lock size={15} weight="fill" className="text-bone-dim" />
            Secure checkout
          </span>
        </div>
      </header>

      <motion.main
        variants={reduce ? calm : rise(24, 0.7)}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-issue px-5 py-12 sm:px-8 sm:py-16"
      >
        <h1
          className="font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}
        >
          Checkout
        </h1>
        <p className="mt-3 max-w-md font-serif text-lg italic text-bone/70">
          {makers.length === 1
            ? "One maker is"
            : `${NUM[makers.length] ?? makers.length} makers are`}{" "}
          getting your order ready. Here&rsquo;s where it goes.
        </p>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16"
        >
          {/* Forms */}
          <div className="flex flex-col gap-10">
            <Fieldset legend="Contact">
              <Field
                name="email"
                label="Email"
                type="email"
                value={values.email}
                onChange={set("email")}
                error={errors.email}
                placeholder="you@example.com"
              />
            </Fieldset>

            <Fieldset legend="Ship to">
              <Field
                name="fullName"
                label="Full name"
                value={values.fullName}
                onChange={set("fullName")}
                error={errors.fullName}
              />
              <Field
                name="address1"
                label="Address"
                value={values.address1}
                onChange={set("address1")}
                error={errors.address1}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="city"
                  label="Town / city"
                  value={values.city}
                  onChange={set("city")}
                  error={errors.city}
                />
                <Field
                  name="postcode"
                  label="Postcode"
                  value={values.postcode}
                  onChange={set("postcode")}
                  error={errors.postcode}
                />
              </div>
              <SelectField
                name="country"
                label="Country"
                value={values.country}
                onChange={set("country")}
                error={errors.country}
                options={[
                  "United Kingdom",
                  "Ireland",
                  "France",
                  "Germany",
                  "United States",
                  "Canada",
                ]}
              />
            </Fieldset>

            <Fieldset legend="Payment">
              <div className="flex items-start gap-3 rounded-2xl border border-marigold/30 bg-marigold/5 px-4 py-3">
                <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-marigold" />
                <p className="font-ui text-sm leading-relaxed text-bone/80">
                  <span className="font-semibold text-bone">Demonstration only.</span>{" "}
                  KOL&nbsp;Pay is mocked for this preview — the test card is
                  pre-filled. Never enter real card details.
                </p>
              </div>
              <Field
                name="cardName"
                label="Name on card"
                value={values.cardName}
                onChange={set("cardName")}
                error={errors.cardName}
              />
              <Field
                name="cardNumber"
                label="Card number"
                value={values.cardNumber}
                onChange={set("cardNumber")}
                error={errors.cardNumber}
                inputMode="numeric"
                icon={<Lock size={16} className="text-bone/40" />}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="expiry"
                  label="Expiry"
                  value={values.expiry}
                  onChange={set("expiry")}
                  error={errors.expiry}
                  placeholder="MM / YY"
                  inputMode="numeric"
                />
                <Field
                  name="cvc"
                  label="CVC"
                  value={values.cvc}
                  onChange={set("cvc")}
                  error={errors.cvc}
                  inputMode="numeric"
                />
              </div>
            </Fieldset>

            {Object.keys(errors).length > 0 && (
              <p role="alert" className={cn("flex items-center gap-2 font-ui text-sm", ERR)}>
                <WarningCircle size={16} weight="fill" />
                Please fix the highlighted fields to place your order.
              </p>
            )}

            <button
              type="submit"
              className="press group flex w-full items-center justify-center gap-2.5 rounded-full bg-marigold px-7 py-4 font-ui text-base font-semibold text-ink hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Place order · {gbp(totals.total)}
              <ArrowRight size={19} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <div className="overflow-hidden rounded-3xl border border-line bg-ink-soft">
              <p className="meta border-b border-line px-6 py-4 text-bone-dim">
                Your bag · {lines.length} pieces
              </p>
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex gap-4 px-6 py-5">
                    <Link
                      href={`/m/${line.product.worldSlug}/p/${line.product.id}`}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
                    >
                      <Image
                        src={line.product.gallery[0]!}
                        alt={line.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/m/${line.product.worldSlug}/p/${line.product.id}`}
                          className="font-ui text-sm font-semibold text-bone transition-colors hover:text-marigold"
                        >
                          {line.product.name}
                        </Link>
                        <span className="font-ui text-sm font-semibold text-bone">
                          {gbp(line.lineTotal)}
                        </span>
                      </div>
                      <p className="mt-1 font-ui text-xs text-bone-dim">
                        Made by {line.maker.name.split(" ").at(0) ?? line.maker.name} ·{" "}
                        {line.maker.place.split(" → ").at(-1) ?? line.maker.place}
                      </p>
                      <p className="mt-auto pt-2 font-ui text-xs text-bone/50">
                        Qty {line.qty}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2.5 border-t border-line px-6 py-5">
                <Row label="Subtotal" value={gbp(totals.subtotal)} />
                <Row
                  label="Shipping"
                  value={totals.shipping === 0 ? "Free · UK" : gbp(totals.shipping)}
                />
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="font-ui text-base font-semibold text-bone">Total</dt>
                  <dd className="font-display text-2xl font-bold text-bone">
                    {gbp(totals.total)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* The human thread — the makers are present. The portrait cluster
                staggers in on scroll and each face lifts on hover, so the people
                readying the order feel present, not printed. */}
            <div className="mt-5 flex items-center gap-4 rounded-3xl border border-line bg-ink-soft px-6 py-5">
              <motion.div
                variants={reduce ? undefined : stagger(0, 0.09)}
                initial="hidden"
                whileInView="visible"
                viewport={inView}
                className="flex -space-x-3"
              >
                {makers.map((m) => (
                  <motion.span
                    key={m.id}
                    variants={reduce ? calm : rise(10, 0.5)}
                    whileHover={reduce ? undefined : { y: -5, scale: 1.09 }}
                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                    className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-ink-soft"
                  >
                    <Image src={m.image} alt={m.name} fill sizes="44px" className="object-cover" />
                  </motion.span>
                ))}
              </motion.div>
              <p className="font-serif text-sm italic leading-snug text-bone/80">
                {makers.map((m) => m.name.split(" ").at(0) ?? m.name).join(" and ")}{" "}
                {makers.length === 1 ? "is" : "are"} readying your order by hand.
              </p>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 font-ui text-xs text-bone-dim">
              <ShieldCheck size={15} weight="fill" className="text-bone-dim" />
              30-day returns · repairs offered for life
            </p>
          </aside>
        </form>
      </motion.main>
    </div>
  );
}

/* The persistent film, docked as a quiet corner presence while you pay. It
   arrives already playing from the product page and continues here; on direct
   entry it fades in. KOL chrome stays plain (D15) — the maker is simply present,
   not selling. */
function CheckoutFilm({ maker, reduce }: { maker: Maker; reduce: boolean }) {
  const { present, driveTo } = useFilm();
  const [card, setCard] = useState({ width: 176, margin: 24, ratio: 16 / 10 });

  // Runs once per maker; the film controls are stable. Checkout keeps the
  // pre-directive BOTTOM-RIGHT dock (the top-left store directive never covered
  // it, and moving it here re-broke the address-field clearance).
  useEffect(() => {
    present({
      makerId: maker.id,
      videoSrc: maker.filmSrc,
      poster: maker.image,
      alt: `${maker.name} — ${maker.studio}`,
      chip: "now-playing",
      stageChip: false,
      dockCorner: "bottom-right",
    });
    const apply = () => {
      const mobile = window.matchMedia("(max-width: 639px)").matches;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = mobile ? 132 : 176;
      const margin = mobile ? 16 : 24;
      setCard({ width, margin, ratio: dockAspect(vw, vh) });
      driveTo(cornerTarget(vw, vh, { width, margin, radius: 16, corner: "bottom-right" }), {
        reduce: prefersReduced,
        duration: 0.55,
      });
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maker.id]);

  return (
    <div
      className="pointer-events-none fixed z-[41]"
      style={{
        right: card.margin,
        bottom: card.margin,
        width: card.width,
        aspectRatio: String(card.ratio),
      }}
    >
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-2.5 pb-2.5 pt-6">
        <p className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-marigold",
              reduce ? "" : "animate-float",
            )}
          />
          <span className="meta text-[0.55rem] text-bone-dim">On the bench</span>
        </p>
        <p className="mt-1 font-ui text-[0.72rem] font-semibold leading-tight text-bone">
          {maker.name.split(" ").at(0) ?? maker.name} is finishing your order
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="font-ui text-sm text-bone-dim">{label}</dt>
      <dd className="font-ui text-sm text-bone">{value}</dd>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="meta mb-1 text-bone-dim">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  inputMode,
  icon,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text" | "email";
  icon?: React.ReactNode;
}) {
  const errId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block font-ui text-sm font-medium text-bone/80">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-ink px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-marigold/45",
          error ? "border-error" : "border-bone/20 focus-within:border-marigold/70",
        )}
      >
        <input
          id={name}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          suppressHydrationWarning
          className="w-full bg-transparent font-ui text-base text-bone placeholder:text-bone/35 focus:outline-none"
        />
        {icon}
      </div>
      {error && (
        <p id={errId} className={cn("mt-1.5 flex items-center gap-1.5 font-ui text-xs", ERR)}>
          <WarningCircle size={13} weight="fill" />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  name,
  label,
  value,
  onChange,
  error,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: string[];
}) {
  const errId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block font-ui text-sm font-medium text-bone/80">
        {label}
      </label>
      <div
        className={cn(
          "relative rounded-xl border bg-ink transition-colors focus-within:ring-2 focus-within:ring-marigold/45",
          error ? "border-error" : "border-bone/20 focus-within:border-marigold/70",
        )}
      >
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className="w-full appearance-none bg-transparent px-4 py-3 pr-11 font-ui text-base text-bone focus:outline-none [&>option]:bg-ink"
        >
          <option value="">Select a country</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-bone-dim"
        />
      </div>
      {error && (
        <p id={errId} className={cn("mt-1.5 flex items-center gap-1.5 font-ui text-xs", ERR)}>
          <WarningCircle size={13} weight="fill" />
          {error}
        </p>
      )}
    </div>
  );
}

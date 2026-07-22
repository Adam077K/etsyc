// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FilmLayerProvider } from "@/components/film/FilmLayer";
import { FEED_CARD_ATTRIBUTE } from "@/components/grow/part-feed";
import type { FeedCard, FeedResult } from "@/lib/feed/select";

import { FeedGrowExperience, growSourceFromCard } from "../FeedGrowExperience";

/**
 * THE FEED → GROW SEAM (integration wiring — the two units shipped
 * unwired). B1b's own suite pins that FeedMagazine calls its `onGrow`
 * prop — against a vi.fn(). B2's own suite drives `grow()` directly with
 * a hand-built GrowSource. Both were green while the feed page rendered
 * FeedMagazine with NO onGrow at all: a tap promoted focus and the
 * journey ended there. This test walks the REAL merged composition — the
 * page's client experience, a genuine card tap — and fails if the tapped
 * card ever stops reaching B2's grow machinery again.
 */

const requestGrownSelection = vi.hoisted(() => vi.fn());
vi.mock("@/lib/grow/actions", () => ({ requestGrownSelection }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

beforeEach(() => {
  requestGrownSelection.mockResolvedValue({ status: "success", grown: null, peers: [] });
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  requestGrownSelection.mockReset();
});

function makeCard(i: number): FeedCard {
  return {
    videoId: `video-${i}`,
    storeId: `store-${i}`,
    storeSlugOrId: `store-${i}`,
    makerName: ["Sena Okafor", "Noor Haddad", "Marta Ferreira", "Isolde Brandt"][i % 4] ?? `Maker ${i}`,
    craft: ["Ceramicist", "Natural dyer", "Letterpress printer", "Glassblower"][i % 4] ?? null,
    place: ["Lisbon", "Amman", "Porto", "Copenhagen"][i % 4] ?? null,
    avatarUrl: null,
    src: `/media/fixtures/clip-${i}.mp4`,
    poster: `/media/ashwork/intro-poster.svg`,
    durationMs: 9000,
    captionsSrc: null,
    aspect: "4:5",
    focalPoint: { x: 0.5, y: 0.32 },
  };
}

const success = (n: number): FeedResult => ({
  status: "success",
  cards: Array.from({ length: n }, (_, i) => makeCard(i)),
});

describe("feed → grow seam — the tapped card reaches B2's machinery", () => {
  it("a real card tap grows THAT card: engine asked for its store+video, its column mounts", async () => {
    const { container } = render(
      <FilmLayerProvider>
        <FeedGrowExperience result={success(4)} />
      </FilmLayerProvider>,
    );

    // the buyer taps Marta's card (index 2) — the REAL tap target
    fireEvent.click(screen.getByRole("button", { name: /Watch Marta Ferreira/ }));

    // B1b's half still holds: the card promoted to focus
    expect(container.querySelector("[data-feed-focus]")).not.toBeNull();

    // …and B2's half now receives the TAPPED card, not nothing: the GROWN
    // engine preset is requested for exactly this card's store and video
    await waitFor(() => {
      expect(requestGrownSelection).toHaveBeenCalledWith({
        storeId: "store-2",
        tappedVideoId: "video-2",
      });
    });
    // the grown column is Marta's
    const column = container.querySelector("[data-grow-column]");
    expect(column).not.toBeNull();
    expect(column?.getAttribute("aria-label")).toBe("Marta Ferreira — grown");

    // the parting contract: B2 parts `[data-feed-card]` elements
    // (FEED_CARD_ATTRIBUTE, part-feed.ts). Behavioural layer of the join:
    // the REAL rendered cards carry B2's selector (B2's own suite plants
    // its own attribute, so only this composition can see a severed join).
    expect(container.querySelectorAll(`[${FEED_CARD_ATTRIBUTE}]`)).toHaveLength(4);
  });

  it("card render sites DERIVE the parting attribute from B2's constant — never re-type it", async () => {
    // instance #8's source fix: a re-typed "data-feed-card" agrees today
    // and drifts on rename; deriving from FEED_CARD_ATTRIBUTE makes a
    // rename move both sides together. This pin catches the literal
    // creeping back (which would keep every behavioural test green).
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    for (const file of [
      "src/components/feed/FeedCard.tsx",
      "src/app/preview/feed/page.tsx",
    ]) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source, `${file} derives from FEED_CARD_ATTRIBUTE`).toMatch(
        /\{\.\.\.\{ \[FEED_CARD_ATTRIBUTE\]: "" \}\}/,
      );
      expect(source, `${file} must not re-type the literal`).not.toMatch(
        /data-feed-card=/,
      );
    }
  });

  it("growSourceFromCard maps field-for-field per B2's seam contract — no renames, focalPoint rides", () => {
    const card = makeCard(1);
    expect(growSourceFromCard(card)).toEqual({
      kind: "video",
      videoId: "video-1",
      storeId: "store-1",
      makerName: "Noor Haddad",
      craft: "Natural dyer",
      place: "Amman",
      src: "/media/fixtures/clip-1.mp4",
      poster: "/media/ashwork/intro-poster.svg",
      captionsSrc: null,
      focalPoint: { x: 0.5, y: 0.32 },
    });
    // the posterless card still grows (the layer's poster-first contract
    // degrades via PosterStill, never blocks the journey)
    expect(growSourceFromCard({ ...card, poster: null }).poster).toBe("");
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StoreConfig } from "@/lib/store-config/types";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { renderStore } from "./render-store";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("renderStore — one renderer, both theme kinds", () => {
  it("renders the full curated (sena) world in block order", () => {
    const { container } = render(<>{renderStore(senaStore)}</>);
    const root = container.querySelector('[data-store="a7f3-ashwork"]');
    expect(root?.getAttribute("data-theme-kind")).toBe("curated");
    // world content composes end to end
    expect(screen.getByText("Sena Okonkwo")).toBeDefined();
    expect(screen.getByText("Ridge Tumbler")).toBeDefined();
    expect(screen.getByText("Message Sena")).toBeDefined();
  });

  it("applies a custom any-hex palette directly as CSS custom properties (no enum coercion, D15)", () => {
    // preview surface — the custom fixture is honestly still in_review
    const { container } = render(<>{renderStore(customStore, { isPreview: true })}</>);
    const root = container.querySelector('[data-store="c2d9-tinctura"]');
    expect(root?.getAttribute("data-theme-kind")).toBe("custom");
    const style = root?.getAttribute("style") ?? "";
    expect(style).toContain("--ground: #10141F");
    expect(style).toContain("--accent: #E3A857");
    expect(screen.getByText("Noor Haddad")).toBeDefined();
  });
});

describe("renderer-level 4 states", () => {
  it("empty: an unpublished store renders the guard, never a broken shell", () => {
    const { container } = render(<>{renderStore(customStore)}</>);
    expect(container.querySelector("[data-unpublished-guard]")).not.toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText(/isn’t open yet/)).toBeDefined();
    // preview (the seller/critic surface) may look at any status
    cleanup();
    const preview = render(<>{renderStore(customStore, { isPreview: true })}</>);
    expect(preview.container.querySelector("[data-unpublished-guard]")).toBeNull();
    expect(preview.container.querySelector('[data-layout-id="hero-video"]')).not.toBeNull();
  });

  it("loading: per-block skeletons are progressive and the hero shows its poster immediately", () => {
    const { container } = render(
      <>
        {renderStore(senaStore, {
          blockStates: { b_hero: "loading", b_story: "loading" },
          isPreview: true,
        })}
      </>,
    );
    // hero poster is up before the film resolves — never a centered spinner
    const hero = container.querySelector('[data-layout-id="hero-video"]');
    expect(hero?.querySelector('img[src*="intro-poster"]')).not.toBeNull();
    expect(hero?.querySelector("[aria-busy='true']")).not.toBeNull();
    // OTHER blocks resolved independently — the showcase renders success
    expect(screen.getByText("Ridge Tumbler")).toBeDefined();
  });

  it("error: a single failed block degrades locally while the world stays usable", () => {
    const { container } = render(
      <>{renderStore(senaStore, { blockStates: { b_story: "error" } })}</>,
    );
    // craft-story reflows text-only: copy survives, its media is dropped
    expect(screen.getByText("Ash from my father’s workshop")).toBeDefined();
    expect(container.querySelector('img[src*="sena-portrait"]')).toBeNull();
    // the rest of the world is untouched
    expect(screen.getByText("Ridge Tumbler")).toBeDefined();
    expect(screen.getByText("Message Sena")).toBeDefined();
  });

  it("a block that CRASHES is contained by its boundary — the world never goes down with it", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const corrupted: StoreConfig = {
      ...senaStore,
      blocks: senaStore.blocks.map((block) =>
        block.type === "craft-story"
          ? {
              ...block,
              // deliberately-broken block: heading violates the contract at
              // runtime (write-time Zod would reject this — render must survive)
              props: { ...block.props, heading: undefined as unknown as string },
            }
          : block,
      ),
    };
    const { container } = render(<>{renderStore(corrupted)}</>);
    expect(container.querySelector('[data-block-crashed="b_story"]')).not.toBeNull();
    // everything around the crashed block still renders
    expect(screen.getByText("Sena Okonkwo")).toBeDefined();
    expect(screen.getByText("Ridge Tumbler")).toBeDefined();
    expect(screen.getByText("Message Sena")).toBeDefined();
  });
});

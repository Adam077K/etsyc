import { describe, expect, it } from "vitest";

import {
  ACCOUNT_PATH,
  BUYER_LANDING,
  SELLER_LANDING,
  SIGN_IN_PATH,
  classifyRoute,
  landingPathFor,
  safeNextPath,
} from "./routes";

describe("classifyRoute", () => {
  it.each([
    ["/", "public"],
    ["/preview", "public"],
    ["/some-store-world", "public"],
    [SIGN_IN_PATH, "auth-entry"],
    [`${SIGN_IN_PATH}/anything`, "auth-entry"],
    [BUYER_LANDING, "buyer"],
    [`${BUYER_LANDING}/saved`, "buyer"],
    [SELLER_LANDING, "seller"],
    [`${SELLER_LANDING}/orders`, "seller"],
    [ACCOUNT_PATH, "account"],
    [`${ACCOUNT_PATH}/settings`, "account"],
  ] as const)("%s → %s", (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it("does not class prefix look-alikes as protected", () => {
    expect(classifyRoute("/feedback")).toBe("public");
    expect(classifyRoute("/sellers-market")).toBe("public");
    expect(classifyRoute("/accounting")).toBe("public");
  });
});

describe("landingPathFor", () => {
  it("routes buyer → feed, seller → dashboard (no cross-boundary leak)", () => {
    expect(landingPathFor("buyer")).toBe(BUYER_LANDING);
    expect(landingPathFor("seller")).toBe(SELLER_LANDING);
  });
});

describe("safeNextPath (open-redirect guard, parse-based)", () => {
  it("passes same-origin relative paths through", () => {
    expect(safeNextPath("/feed")).toBe("/feed");
    expect(safeNextPath("/seller/orders")).toBe("/seller/orders");
    expect(safeNextPath("/feed?tab=new")).toBe("/feed?tab=new");
    expect(safeNextPath("/seller/orders?tab=open")).toBe(
      "/seller/orders?tab=open",
    );
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "https://evil.example",
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "javascript:alert(1)",
    "feed",
  ])("drops %j", (bad) => {
    expect(safeNextPath(bad)).toBeNull();
  });

  // Control-char bypass (sec-p1): browsers strip tab/newline per the WHATWG
  // URL spec, so `Location: /\t//evil.com` resolves to https://evil.com/.
  // ?next=/%09//evil.com arrives DECODED (literal tab) from searchParams;
  // the raw percent-encoded string is rejected too (defense in depth).
  it.each([
    "/%09//evil.com",
    "/\t//evil.com",
    "/%0a/evil.com",
    "/\n/evil.com",
    "/\n//evil.com",
    "/\r//evil.com",
    "/\u0000/evil.com",
    "/%00/evil.com",
    "/%7f//evil.com",
  ])("drops control-char smuggle %j", (bad) => {
    expect(safeNextPath(bad)).toBeNull();
  });

  // Dot-segment normalization bypass (sec-p1 round 2): "/..//evil.com"
  // parses with the dummy origin intact, but the dot-segment collapses the
  // pathname to "//evil.com" — itself protocol-relative in a Location
  // header. The guard re-validates its own OUTPUT, closing the class.
  it.each([
    "/..//evil.com",
    "/../..//evil.com",
    "/a/../..//evil.com",
    "/..//evil.com/path",
    "/..//@evil.com",
    "/..//evil.com?x=1",
    "/./..//evil.com",
  ])("drops dot-segment smuggle %j", (bad) => {
    expect(safeNextPath(bad)).toBeNull();
  });

  it("keeps legit internal dot-segments — they normalize same-origin", () => {
    expect(safeNextPath("/seller/../feed")).toBe("/feed");
    expect(safeNextPath("/feed/./saved")).toBe("/feed/saved");
    expect(safeNextPath("/feed#frag")).toBe("/feed#frag");
  });

  it("proves the browser-side risk the parser guards against", () => {
    // The repro from the finding: WHATWG resolution of a tab-smuggled path.
    expect(new URL("/\t//evil.com", "https://kol.example").origin).toBe(
      "https://evil.com",
    );
  });

  it("drops over-long paths (3000 chars)", () => {
    expect(safeNextPath(`/${"a".repeat(3000)}`)).toBeNull();
  });

  // W1-FF fix 3 — explicit next-param length bound (additive: tighter than
  // the old 2048 parse cap; rejected values fall back to the role landing).
  it("accepts a path at the 512-char bound and drops one char over", () => {
    expect(safeNextPath(`/${"a".repeat(511)}`)).toBe(`/${"a".repeat(511)}`);
    expect(safeNextPath(`/${"a".repeat(512)}`)).toBeNull();
  });

  it("bounds the NORMALIZED output too — encoding can lengthen the input", () => {
    // Short unicode paths stay fine (the rejection below is length-driven,
    // not charset-driven)…
    expect(safeNextPath("/é")).toBe("/%C3%A9");
    // …but 201 raw chars percent-encode to 1201 — over the bound, dropped.
    expect(safeNextPath(`/${"é".repeat(200)}`)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
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
  ] as const)("%s → %s", (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it("does not class prefix look-alikes as protected", () => {
    expect(classifyRoute("/feedback")).toBe("public");
    expect(classifyRoute("/sellers-market")).toBe("public");
  });
});

describe("landingPathFor", () => {
  it("routes buyer → feed, seller → dashboard (no cross-boundary leak)", () => {
    expect(landingPathFor("buyer")).toBe(BUYER_LANDING);
    expect(landingPathFor("seller")).toBe(SELLER_LANDING);
  });
});

describe("safeNextPath (open-redirect guard)", () => {
  it("passes same-origin relative paths through", () => {
    expect(safeNextPath("/feed")).toBe("/feed");
    expect(safeNextPath("/seller/orders?tab=open")).toBe(
      "/seller/orders?tab=open",
    );
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "feed",
  ])("drops %j", (bad) => {
    expect(safeNextPath(bad)).toBeNull();
  });
});

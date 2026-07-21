import { expect, test } from "@playwright/test";
import { resetState } from "./helpers";

/**
 * The write loops that make this a prototype rather than a mockup:
 * community posting (gated on membership), single-level comments, and a
 * review submitted in /me/reviews landing on the product page it belongs to.
 *
 * Noor's room is used for the membership gate on purpose — the seeded
 * session already follows Sena, so her room could never show the gate.
 */

const POST_BODY = "Testing the vat-day room — does this thread survive a reload?";
const COMMENT_BODY = "Replying to my own thread, one level deep.";
const REVIEW_BODY = "Arrived heavier than I pictured, in the best way. The ridge is real.";

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("community posting is gated on membership, and a post survives a reload", async ({
  page,
}) => {
  await page.goto("/m/noor/community");

  /* ---------- not a member: gated ---------- */
  const joinButton = page.getByRole("button", { name: "Join to post", exact: true });
  await expect(joinButton).toBeVisible();
  await expect(page.getByLabel("Start a thread")).toHaveCount(0);

  /* ---------- joining is the same action as following ---------- */
  await joinButton.click();
  await expect(page.getByRole("button", { name: /Member — following/i })).toBeVisible();

  const composer = page.getByLabel("Start a thread");
  await expect(composer).toBeVisible();

  /* ---------- post ---------- */
  await composer.fill(POST_BODY);
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByText(POST_BODY)).toBeVisible();
  await expect(composer).toHaveValue("");

  /* ---------- and it is written, not just rendered ---------- */
  await page.reload();
  await expect(page.getByText(POST_BODY)).toBeVisible();
});

test("a single-level comment appears on the post it belongs to", async ({ page }) => {
  await page.goto("/m/noor/community");
  await page.getByRole("button", { name: "Join to post", exact: true }).click();
  await page.getByLabel("Start a thread").fill(POST_BODY);
  await page.getByRole("button", { name: "Post", exact: true }).click();

  const post = page.getByRole("article").filter({ hasText: POST_BODY });
  await expect(post).toBeVisible();

  const reply = post.getByRole("textbox", { name: /Reply to this post/i });
  await expect(reply).toBeVisible();
  await reply.fill(COMMENT_BODY);
  await post.getByRole("button", { name: "Reply", exact: true }).click();

  await expect(post.getByText(COMMENT_BODY)).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("article").filter({ hasText: POST_BODY }).getByText(COMMENT_BODY),
  ).toBeVisible();
});

test("a review written in /me/reviews shows up on the product page", async ({ page }) => {
  await page.goto("/me/reviews");

  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByRole("button", { name: "Exactly as described", exact: true }).click();
  await page.getByLabel("Your words").fill(REVIEW_BODY);
  await page.getByRole("button", { name: /Post review/i }).click();

  // confirmation, and it joins the buyer's own list
  await expect(page.getByRole("status")).toContainText(/now lives on the product page/i);
  await expect(page.getByText(REVIEW_BODY)).toBeVisible();

  /* ---------- the point: it is on the product ---------- */
  await page.goto("/m/sena/p/ridge-tumbler");
  await expect(page.getByText(REVIEW_BODY)).toBeVisible();
  // verification is derived from the order, never claimed by the form
  await expect(
    page.getByText(/Verified purchase/).first(),
  ).toBeVisible();
});

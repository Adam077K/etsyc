"use client";

/**
 * Maker Community (B15 · D17 decided 2026-07-21) — /m/[maker]/community.
 * Community is a LAYER on the maker's world, not the defining feature:
 * the maker's voice leads (primary layer = maker updates), buyer↔buyer
 * discussion rides underneath (single-level comments, never nested
 * deeper). Moderation is hide-only. Membership rides on follows.
 * Cold start is designed, never blank.
 */

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { communityFor, getMaker, type MockPost } from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";
import { useKolStore } from "@/lib/mock/store";
import { Film } from "@/components/chrome/Film";

/** Single-level comment composer. There is no reply-to-a-reply — nesting is a
 *  moderation-cost multiplier and the spec keeps discussion one level deep. */
function CommentComposer({
  postId,
  makerName,
  onSubmit,
}: {
  postId: string;
  makerName: string;
  onSubmit: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputId = `comment-${postId}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onSubmit(body);
    setDraft("");
  };

  return (
    <form onSubmit={submit} className="mt-2 flex items-center gap-2 border-l border-line pl-5">
      <label htmlFor={inputId} className="sr-only">
        Reply to this post
      </label>
      <input
        id={inputId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`Reply to ${makerName}'s room…`}
        className="min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={draft.trim().length === 0}
        className="min-h-11 flex-none rounded-pill border border-line bg-surface px-4 text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-ground disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reply
      </button>
    </form>
  );
}

function CommentRow({
  comment,
  commentKey,
  makerName,
  hidden,
  onHide,
  onUnhide,
}: {
  comment: { author: string; body: string; when: string; hidden?: boolean };
  commentKey: string;
  makerName: string;
  hidden: boolean;
  onHide: (key: string) => void;
  onUnhide: (key: string) => void;
}) {
  if (hidden) {
    return (
      <div className="flex items-center justify-between gap-3 border-l border-line py-2 pl-5">
        <p className="text-caption italic text-muted">Hidden by you</p>
        <button
          type="button"
          onClick={() => onUnhide(commentKey)}
          className="text-caption uppercase tracking-[0.04em] text-muted transition-colors duration-state ease-kol hover:text-ink"
        >
          Undo
        </button>
      </div>
    );
  }
  const isMakerComment = comment.author === makerName;
  return (
    <div className="border-l border-line py-2 pl-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-caption uppercase tracking-[0.04em] text-muted">
          {comment.author}
          {isMakerComment ? " · maker" : ""} · {comment.when}
        </p>
        {!isMakerComment ? (
          <button
            type="button"
            onClick={() => onHide(commentKey)}
            className="inline-flex min-h-11 items-center text-caption uppercase tracking-[0.04em] text-muted transition-colors duration-state ease-kol hover:text-ink"
          >
            Hide
          </button>
        ) : null}
      </div>
      <p className="mt-1 max-w-measure text-body text-ink">{comment.body}</p>
    </div>
  );
}

/** Member post composer, gated on membership — joining reveals it at once. */
function PostComposer({
  member,
  makerName,
  onJoin,
  onPost,
}: {
  member: boolean;
  makerName: string;
  onJoin: () => void;
  onPost: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");

  if (!member) {
    return (
      <div className="rounded-md border border-dashed border-line bg-surface/60 p-5">
        <p className="text-body text-ink">Join to post</p>
        <p className="mt-1 max-w-measure text-caption text-muted">
          Members can start threads here. Joining follows {makerName}
          {" — that’s the same action, not a second one."}
        </p>
        <button
          type="button"
          onClick={onJoin}
          className="mt-4 min-h-11 rounded-pill bg-accent-cta px-6 text-body font-bold text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
        >
          Join to post
        </button>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onPost(body);
    setDraft("");
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-line bg-surface p-5 shadow-subtle"
    >
      <label htmlFor="community-post" className="text-caption uppercase tracking-[0.04em] text-muted">
        Start a thread
      </label>
      <textarea
        id="community-post"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`Something you noticed, asked, or want other members of ${makerName}'s room to know…`}
        className="mt-2 min-h-24 w-full rounded-sm border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          className="min-h-11 rounded-pill bg-accent-cta px-6 text-body font-bold text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Post
        </button>
        <span className="text-caption text-muted">
          Posts sit under {makerName}&rsquo;s updates — replies stay one level deep.
        </span>
      </div>
    </form>
  );
}

export default function CommunityPage({ params }: { params: Promise<{ maker: string }> }) {
  const { maker: slug } = use(params);
  const session = useKolSession();
  const store = useKolStore();

  const maker = getMaker(slug);
  if (!maker) notFound();

  const community = communityFor(slug);
  const member = session.isFollowing(slug);

  // Hide-only moderation lives in the shared store, so a hide survives a reload.
  const hide = (key: string) => {
    if (!store.isHidden(key)) store.toggleHidden(key);
  };
  const unhide = (key: string) => {
    if (store.isHidden(key)) store.toggleHidden(key);
  };
  const isHidden = (key: string, dbHidden?: boolean) =>
    Boolean(dbHidden) || store.isHidden(key);

  // no community entry — quiet, not an error
  if (!community) {
    return (
      <main className="mx-auto w-full max-w-page px-6 pb-24">
        <div className="mx-auto max-w-[560px] py-20">
          <div className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
            <p className="font-display text-h3 text-ink">No community yet</p>
            <p className="mx-auto mt-2 max-w-measure text-body text-muted">
              {maker.name} hasn&rsquo;t opened a room around the work. The world itself is
              where everything lives for now.
            </p>
            <Link
              href={`/m/${slug}`}
              className="mt-5 inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-6 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
            >
              Back to {maker.name}&rsquo;s world
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Posts come from the mutable store — the seed lives in db.ts, everything
  // written in this room since then lives here.
  const posts = store.postsFor(slug);
  const makerPosts = posts
    .filter((p) => p.isMaker)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const memberPosts = posts.filter((p) => !p.isMaker);
  const coldStart = posts.length === 0;

  const submitPost = (body: string) => store.addPost(slug, body);
  const submitComment = (postId: string, body: string) => store.addComment(slug, postId, body);

  const memberNames = Array.from(
    new Set(
      posts.flatMap((p: MockPost) => [
        ...(p.isMaker ? [] : [p.author]),
        ...p.comments.filter((c) => c.author !== maker.name).map((c) => c.author),
      ]),
    ),
  );

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-24">
      {/* header */}
      <header className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href={`/m/${slug}`}
              aria-label={`Open ${maker.name}’s world`}
              className="flex-none"
            >
              <Film
                variant={maker.filmClass}
                aspect="square"
                play={false}
                rounded={false}
                className="w-14 rounded-pill shadow-none"
              />
            </Link>
            <div>
              <p className="text-caption uppercase tracking-[0.08em] text-muted">
                {maker.craft} · {maker.location}
              </p>
              <h1 className="mt-1 font-display text-h1 text-ink">
                {maker.name}&rsquo;s Community
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  {community.visibility}
                </span>
                <span className="text-caption text-muted">
                  {community.members} member{community.members === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => session.toggleFollow(slug)}
            className={`min-h-11 rounded-pill px-6 text-body transition-colors duration-state ease-kol active:scale-[0.98] ${
              member
                ? "border border-line bg-surface text-ink hover:bg-ground"
                : "bg-accent-cta font-bold text-accent-ink hover:bg-accent-cta/90"
            }`}
          >
            {member ? "Member — following" : `Join (follows ${maker.name})`}
          </button>
        </div>
        <p className="mt-3 max-w-measure text-caption text-muted">
          Buyer↔buyer is a layer here — the maker&rsquo;s voice leads.
        </p>
      </header>

      {coldStart ? (
        /* cold start — designed, never a blank page */
        <section aria-label="Quiet room" className="mx-auto max-w-[640px]">
          <div className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
            <p className="font-display text-h3 text-ink">It&rsquo;s quiet in here.</p>
            <p className="mx-auto mt-3 max-w-measure text-body text-muted">
              {community.members} members, nothing posted yet. {maker.name} posts{" "}
              {slug === "noor" ? "vat-day films" : "studio updates"} here first.
            </p>
            <div className="mt-6 border-t border-line pt-5 text-left">
              <p className="text-caption uppercase tracking-[0.04em] text-muted">
                While the room warms up
              </p>
              {community.exclusives.map((x) => (
                <div key={x.title} className="mt-3">
                  <p className="text-body font-semibold text-ink">{x.title}</p>
                  <p className="text-caption text-muted">{x.note}</p>
                </div>
              ))}
            </div>
          </div>
          {/* the cold start is meant to be resolvable — posting clears it */}
          <div className="mt-4 text-left">
            <PostComposer
              member={member}
              makerName={maker.name}
              onJoin={() => session.toggleFollow(slug)}
              onPost={submitPost}
            />
          </div>
        </section>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* LEFT — primary layer: the maker's voice, then discussion */}
          <div className="flex flex-col gap-8">
            <section aria-label={`Updates from ${maker.name}`} className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-h3 text-ink">Updates from {maker.name}</h2>
                <span className="text-caption uppercase tracking-[0.04em] text-muted">
                  maker → members
                </span>
              </div>
              {makerPosts.length === 0 ? (
                <p className="rounded-md border border-dashed border-line bg-surface/60 p-4 text-body text-muted">
                  {maker.name} hasn&rsquo;t posted here yet.
                </p>
              ) : (
                makerPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-md border border-line bg-surface p-5 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Film
                          variant={maker.filmClass}
                          aspect="square"
                          play={false}
                          rounded={false}
                          className="w-11 flex-none rounded-pill shadow-none"
                        />
                        <div>
                          <p className="text-body font-semibold text-ink">{post.author}</p>
                          <p className="text-caption text-muted">posted · {post.when}</p>
                        </div>
                      </div>
                      {post.pinned ? (
                        <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 max-w-measure text-body-lg text-ink">
                      &ldquo;{post.body}&rdquo;
                    </p>
                    {/* member replies ride underneath — one level, never deeper */}
                    {post.comments.length > 0 ? (
                      <div className="mt-4 flex flex-col gap-1">
                        {post.comments.map((c, i) => {
                          const key = `${slug}-${post.id}-${i}`;
                          return (
                            <CommentRow
                              key={key}
                              comment={c}
                              commentKey={key}
                              makerName={maker.name}
                              hidden={isHidden(key, c.hidden)}
                              onHide={hide}
                              onUnhide={unhide}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                    {member ? (
                      <CommentComposer
                        postId={post.id}
                        makerName={maker.name}
                        onSubmit={(body) => submitComment(post.id, body)}
                      />
                    ) : null}
                  </article>
                ))
              )}
            </section>

            <section aria-label="Member discussion" className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-h3 text-ink">Discussion</h2>
                <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  member ↔ member
                </span>
              </div>
              <PostComposer
                member={member}
                makerName={maker.name}
                onJoin={() => session.toggleFollow(slug)}
                onPost={submitPost}
              />
              {memberPosts.length === 0 ? (
                <p className="rounded-md border border-dashed border-line bg-surface/60 p-4 text-body text-muted">
                  No member threads yet — the maker&rsquo;s updates carry the room for now.
                </p>
              ) : (
                memberPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-md border border-line bg-surface p-5 shadow-subtle"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-caption uppercase tracking-[0.04em] text-muted">
                        {post.author} · {post.when}
                      </p>
                    </div>
                    <p className="mt-1 max-w-measure text-body text-ink">{post.body}</p>
                    {post.comments.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-1">
                        {post.comments.map((c, i) => {
                          const key = `${slug}-${post.id}-${i}`;
                          return (
                            <CommentRow
                              key={key}
                              comment={c}
                              commentKey={key}
                              makerName={maker.name}
                              hidden={isHidden(key, c.hidden)}
                              onHide={hide}
                              onUnhide={unhide}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                    {member ? (
                      <CommentComposer
                        postId={post.id}
                        makerName={maker.name}
                        onSubmit={(body) => submitComment(post.id, body)}
                      />
                    ) : null}
                  </article>
                ))
              )}
              <p className="text-caption text-muted">
                Moderation here is hide-only: hiding tucks a comment away for you, quietly.
              </p>
            </section>
          </div>

          {/* RIGHT — exclusives + members */}
          <aside className="flex flex-col gap-4">
            <section className="rounded-md border border-line bg-surface p-5 shadow-subtle">
              <div className="flex items-baseline justify-between">
                <p className="text-caption uppercase tracking-[0.04em] text-muted">
                  Exclusive releases
                </p>
                <span className="text-caption text-muted">members first</span>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {community.exclusives.map((x) => (
                  <div key={x.title} className="flex items-start gap-3">
                    <Film
                      variant={maker.filmClass}
                      aspect="square"
                      play={false}
                      rounded={false}
                      className="w-14 flex-none rounded-md shadow-none"
                    />
                    <div>
                      <p className="text-body font-semibold text-ink">{x.title}</p>
                      <p className="text-caption text-muted">{x.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-line bg-surface p-5 shadow-subtle">
              <div className="flex items-baseline justify-between">
                <p className="text-caption uppercase tracking-[0.04em] text-muted">Members</p>
                <span className="text-body text-ink">{community.members}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {memberNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-pill border border-line bg-ground px-3 py-1 text-caption text-muted"
                  >
                    {name}
                  </span>
                ))}
                {community.members > memberNames.length ? (
                  <span className="rounded-pill border border-dashed border-line px-3 py-1 text-caption text-muted">
                    +{community.members - memberNames.length} more
                  </span>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}

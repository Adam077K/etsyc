import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Masthead } from "@/components/masthead";
import { SiteFooter } from "@/components/site-footer";
import { JournalStoryView } from "@/components/journal-story";
import { getStory, STORY_SLUGS } from "@/lib/fixtures/journal";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return STORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return { title: "The Journal — KOL" };
  return {
    title: `${story.title} — The Journal · KOL`,
    description: story.standfirst,
  };
}

export default async function JournalStoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();
  return (
    <>
      {/* Overlay masthead — the cover-story hero film sits behind the bar. */}
      <Masthead variant="overlay" active="Journal" />
      <JournalStoryView story={story} />
      <SiteFooter />
    </>
  );
}

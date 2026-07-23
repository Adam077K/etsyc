import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMaker } from "@/lib/fixtures/makers";
import { getWorld, WORLD_SLUGS } from "@/lib/fixtures/worlds";
import { MakerWorld } from "@/components/maker-world";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return WORLD_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const maker = getMaker(slug);
  if (!maker) return { title: "Maker — KOL" };
  return {
    title: `${maker.studio} — KOL`,
    description: `${maker.discipline} by ${maker.name}, ${maker.place}. Meet the maker, on film.`,
  };
}

export default async function MakerWorldPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const maker = getMaker(slug);
  const world = getWorld(slug);
  if (!maker || !world) notFound();
  return <MakerWorld maker={maker} world={world} />;
}

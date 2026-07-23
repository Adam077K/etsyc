import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMaker } from "@/lib/fixtures/makers";
import { getWorld } from "@/lib/fixtures/worlds";
import { getProduct, allProductParams } from "@/lib/fixtures/commerce";
import { ProductPage } from "@/components/product-page";

type Params = { slug: string; product: string };

export function generateStaticParams(): Params[] {
  return allProductParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, product: productId } = await params;
  const maker = getMaker(slug);
  const product = getProduct(slug, productId);
  if (!maker || !product) return { title: "Product — KOL" };
  return {
    title: `${product.name} — ${maker.studio} · KOL`,
    description: `${product.name} by ${maker.name}, ${maker.place}. ${product.price}. Made to order.`,
  };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug, product: productId } = await params;
  const maker = getMaker(slug);
  const world = getWorld(slug);
  const product = getProduct(slug, productId);
  if (!maker || !world || !product) notFound();
  return <ProductPage maker={maker} world={world} product={product} />;
}

import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { TryOnPanel } from "@/components/tryon/TryOnPanel";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/queries/products";
import { safeFirstProductImageUrl } from "@/lib/images";

function safeFirstImage(urls: unknown): string | null {
  return safeFirstProductImageUrl(urls);
}

function formatPrice(priceCents: number, currency: string) {
  const value = priceCents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, id);

  if (!product) notFound();

  const firstImage = safeFirstImage(product.mannequin_media_urls);

  return (
    <div className="flex-1 bg-background">
      <TopNav />
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-10">
            <div className="rounded-[34px] bg-surface p-7 shadow-soft ring-1 ring-border">
              <div className="relative overflow-hidden rounded-3xl ring-1 ring-border">
                <div className="relative aspect-square bg-[linear-gradient(135deg,#ffffff,#eef2f7)]">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(31,183,173,0.22),transparent_62%)] opacity-70" />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.18))]" />
                  <div className="absolute left-6 top-6 rounded-full bg-[rgba(255,255,255,0.75)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-foreground ring-1 ring-border">
                    {firstImage ? "Product photo" : "Image placeholder"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">{product.brand}</p>
              <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.05em] text-foreground">
                {product.name}
              </h1>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {formatPrice(product.price_cents, product.currency)}
                </p>
                <div className="w-full sm:w-auto">
                  <AddToCartButton productId={id} className="w-full sm:w-auto" />
                </div>
              </div>
              <p className="mt-4 text-base leading-7 text-muted">{product.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-border">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Fit notes</p>
                  <p className="mt-3 text-sm leading-6 text-foreground">{product.fit_notes}</p>
                </div>
                <div className="rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-border">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Sizing</p>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Size chart placeholder (akan dibuat).
                  </p>
                  <div className="mt-4 h-10 rounded-2xl bg-surface-2 ring-1 ring-border" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:pt-2">
            <TryOnPanel productId={id} productName={product.name} />
          </div>
        </div>
      </Container>
    </div>
  );
}

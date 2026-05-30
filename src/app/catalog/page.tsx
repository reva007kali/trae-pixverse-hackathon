import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { Button, ButtonLink } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listProducts, type ProductSort } from "@/lib/queries/products";
import { safeFirstProductImageUrl } from "@/lib/images";

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

function safeFirstImage(urls: unknown): string | null {
  return safeFirstProductImageUrl(urls);
}

function isProductSort(value: string): value is ProductSort {
  return (
    value === "newest" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "name_asc" ||
    value === "name_desc"
  );
}

function priceToCents(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    min?: string;
    max?: string;
    sort?: string;
  }>;
}) {
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let errorMessage: string | null = null;
  const params = (await searchParams) ?? {};
  const q = params.q?.toString() ?? "";
  const brand = params.brand?.toString() ?? "";
  const category = params.category?.toString() ?? "";
  const min = params.min?.toString() ?? "";
  const max = params.max?.toString() ?? "";
  const sortRaw = params.sort?.toString() ?? "";
  const sort = sortRaw && isProductSort(sortRaw) ? sortRaw : undefined;
  const resetHref = q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog";

  try {
    const supabase = await createSupabaseServerClient();
    products = await listProducts(supabase, {
      limit: 36,
      query: q,
      brand: brand || undefined,
      category: category || undefined,
      minPriceCents: priceToCents(min),
      maxPriceCents: priceToCents(max),
      sort,
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Gagal memuat catalog.";
  }

  return (
    <div className="flex-1 bg-background">
      <TopNav />
      <Container className="py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Discovery</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">
              Premium catalog
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Tampilan default e-commerce: manekin standar. Klik produk lalu tekan “Put You As A
              Model”.
            </p>
            {q ? (
              <p className="mt-4 text-sm text-muted">
                Hasil pencarian untuk <span className="font-medium text-foreground">“{q}”</span>
              </p>
            ) : null}
          </div>
          <div className="hidden md:block">
            <div className="rounded-3xl bg-surface px-5 py-4 shadow-soft ring-1 ring-border">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Accent</p>
              <p className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                Tosca signal
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-border">
          <form method="get" className="grid gap-4 md:grid-cols-12">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Brand</p>
              <input
                name="brand"
                defaultValue={brand}
                placeholder="Contoh: Nike"
                className="mt-2 h-11 w-full rounded-full bg-background px-4 text-sm text-foreground shadow-soft ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Category</p>
              <input
                name="category"
                defaultValue={category}
                placeholder="Contoh: fashion"
                className="mt-2 h-11 w-full rounded-full bg-background px-4 text-sm text-foreground shadow-soft ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Min price</p>
              <input
                name="min"
                inputMode="decimal"
                defaultValue={min}
                placeholder="0"
                className="mt-2 h-11 w-full rounded-full bg-background px-4 text-sm text-foreground shadow-soft ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Max price</p>
              <input
                name="max"
                inputMode="decimal"
                defaultValue={max}
                placeholder="999"
                className="mt-2 h-11 w-full rounded-full bg-background px-4 text-sm text-foreground shadow-soft ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Sort</p>
              <select
                name="sort"
                defaultValue={sort ?? "newest"}
                className="mt-2 h-11 w-full rounded-full bg-background px-4 text-sm text-foreground shadow-soft ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
              </select>
            </div>
            <div className="md:col-span-12 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <Button type="submit" size="sm">
                Apply filters
              </Button>
              <ButtonLink href={resetHref} variant="secondary" size="sm">
                Reset
              </ButtonLink>
            </div>
          </form>
        </div>

        {errorMessage ? (
          <div className="mt-10 rounded-3xl bg-surface p-7 shadow-soft ring-1 ring-border">
            <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
              Catalog belum siap
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">{errorMessage}</p>
            <p className="mt-4 text-sm leading-6 text-muted">
              Pastikan kamu sudah menjalankan SQL di <span className="font-medium">supabase/schema.sql</span>{" "}
              lalu jalankan seeder.
            </p>
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const first = safeFirstImage(p.mannequin_media_urls);
            return (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group rounded-3xl bg-surface shadow-soft ring-1 ring-border transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#ffffff,#eef2f7)] ring-1 ring-[rgba(13,20,32,0.10)]">
                    {first ? (
                      <Image
                        src={first}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(31,183,173,0.25),transparent_62%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.12))]" />
                    <div className="absolute left-5 top-5 rounded-full bg-[rgba(255,255,255,0.75)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-foreground ring-1 ring-border">
                      {first ? "Image" : "Mannequin view"}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">{p.brand}</p>
                    <p className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                      {p.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <p className="text-sm text-muted">{formatPrice(p.price_cents, p.currency)}</p>
                      <div className="h-9 rounded-full bg-[rgba(31,183,173,0.12)] px-4 text-sm font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)] grid place-items-center">
                        Put you as model
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useId, useMemo } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Container } from "@/components/layout/Container";
import { safeFirstProductImageUrl } from "@/lib/images";

import "swiper/css";
import "swiper/css/navigation";

type ProductLite = {
  id: string;
  name: string;
  brand: string;
  price_cents: number;
  currency: string;
  mannequin_media_urls: unknown;
};

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

export function ProductSlider({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: ProductLite[];
}) {
  const id = useId().replaceAll(":", "");
  const prevId = `slider-prev-${id}`;
  const nextId = `slider-next-${id}`;

  const canScroll = useMemo(() => products.length > 0, [products.length]);

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              {subtitle ?? "Featured"}
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">
              {title}
            </h2>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              disabled={!canScroll}
              id={prevId}
              className="grid h-11 w-11 place-items-center rounded-full bg-surface ring-1 ring-border transition-colors hover:bg-surface-2 disabled:opacity-50"
              aria-label="Scroll left"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="text-muted"
              >
                <path
                  d="M15 18 9 12l6-6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              disabled={!canScroll}
              id={nextId}
              className="grid h-11 w-11 place-items-center rounded-full bg-surface ring-1 ring-border transition-colors hover:bg-surface-2 disabled:opacity-50"
              aria-label="Scroll right"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="text-muted"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,var(--background),transparent)] md:w-14" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,var(--background),transparent)] md:w-14" />

          <div className="rounded-[34px]">
            <Swiper
            modules={[Navigation]}
            navigation={{
              enabled: true,
              prevEl: `#${prevId}`,
              nextEl: `#${nextId}`,
            }}
            spaceBetween={16}
            slidesPerView={1.15}
            slidesOffsetBefore={12}
            slidesOffsetAfter={12}
            className="py-6 md:py-7"
            breakpoints={{
              520: { slidesPerView: 1.6, slidesOffsetBefore: 14, slidesOffsetAfter: 14 },
              768: { slidesPerView: 2.4, slidesOffsetBefore: 18, slidesOffsetAfter: 18 },
              1024: { slidesPerView: 3.3, slidesOffsetBefore: 22, slidesOffsetAfter: 22 },
              1280: { slidesPerView: 4.2, slidesOffsetBefore: 24, slidesOffsetAfter: 24 },
            }}
          >
            {products.map((p) => {
              const first = safeFirstImage(p.mannequin_media_urls);
              return (
                <SwiperSlide key={p.id}>
                  <Link
                    href={`/product/${p.id}`}
                    className="block rounded-3xl bg-surface ring-1 ring-border transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
                  >
                    <div className="overflow-hidden rounded-3xl">
                      <div className="relative aspect-square w-full bg-[linear-gradient(135deg,#ffffff,#eef2f7)]">
                        {first ? (
                          <Image
                            src={first}
                            alt={p.name}
                            fill
                            sizes="(min-width: 1280px) 260px, (min-width: 768px) 240px, 220px"
                            className="object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.16))]" />
                        <div className="absolute left-4 top-4 rounded-full bg-[rgba(255,255,255,0.75)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-foreground ring-1 ring-border">
                          {first ? "Image" : "Mannequin"}
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted">{p.brand}</p>
                        <p className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                          {p.name}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-sm text-muted">
                            {formatPrice(p.price_cents, p.currency)}
                          </p>
                          <div className="grid h-9 place-items-center rounded-full bg-[rgba(31,183,173,0.12)] px-4 text-sm font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)]">
                            Try-on
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
            </Swiper>
          </div>
        </div>
      </Container>
    </section>
  );
}

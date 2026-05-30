import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { ProductSlider } from "@/components/products/ProductSlider";
import { BentoCard } from "@/components/ui/BentoCard";
import { ButtonLink } from "@/components/ui/Button";
import { listProducts } from "@/lib/queries/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  let sportProducts: Awaited<ReturnType<typeof listProducts>> = [];
  let casualProducts: Awaited<ReturnType<typeof listProducts>> = [];
  let womanProducts: Awaited<ReturnType<typeof listProducts>> = [];
  let kidsProducts: Awaited<ReturnType<typeof listProducts>> = [];

  try {
    const supabase = await createSupabaseServerClient();
    [sportProducts, casualProducts, womanProducts, kidsProducts] = await Promise.all([
      listProducts(supabase, { limit: 12, category: "sport" }),
      listProducts(supabase, { limit: 12, category: "casual" }),
      listProducts(supabase, { limit: 12, category: "woman" }),
      listProducts(supabase, { limit: 12, category: "kids" }),
    ]);
  } catch {
    sportProducts = [];
    casualProducts = [];
    womanProducts = [];
    kidsProducts = [];
  }

  return (
    <div className="flex-1 bg-background">
      <TopNav />

      <section className="relative">
        <div className="relative -mt-16 h-[100svh] min-h-[720px] w-full overflow-hidden pt-16">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/pixverse-video/sporty.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.62),rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.35))]" />
          <div className="pointer-events-none absolute -inset-24 bg-[radial-gradient(closest-side,rgba(31,183,173,0.35),transparent_70%)] opacity-70" />

          <Container className="relative h-full">
            <div className="flex h-full items-end pb-14 pt-20">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.72)]">
                  AuraFit· Premium e-commerce try-on
                </p>
                <h1 className="mt-5 font-display text-6xl font-semibold tracking-[-0.06em] text-white">
                 Stop Guessing, Start Wearing.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-[rgba(255,255,255,0.78)]">
                  Upload 1 front photo + biometrics, then AuraFit generates your profile video and recommends the right size — all in a premium try-on flow.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <ButtonLink
                    href="/onboarding"
                    size="lg"
                    className="bg-[rgba(31,183,173,0.92)] text-[rgba(6,41,40,1)] hover:bg-[rgba(14,165,167,0.96)]"
                  >
                    Mulai onboarding
                  </ButtonLink>
                  <ButtonLink
                    href="/catalog"
                    variant="secondary"
                    size="lg"
                    className={[
                      "relative isolate overflow-hidden",
                      "bg-transparent text-white ring-0",
                      "shadow-[0_22px_70px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(0,0,0,0.44)] active:translate-y-0",
                      "before:absolute before:inset-0 before:-z-10 before:content-[''] before:rounded-full",
                      "before:bg-[linear-gradient(120deg,rgba(31,183,173,0.92),rgba(255,255,255,0.22),rgba(31,183,173,0.62))] before:opacity-80",
                      "after:absolute after:inset-px after:-z-10 after:content-[''] after:rounded-full after:bg-[rgba(255,255,255,0.12)] after:backdrop-blur",
                      "hover:after:bg-[rgba(255,255,255,0.16)]",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2">
                      Lihat catalog
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="text-white/90"
                      >
                        <path
                          d="M9 6h10v10"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 6 9 16"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </ButtonLink>
                </div>

                <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[rgba(255,255,255,0.10)] px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,0.22)] ring-1 ring-[rgba(255,255,255,0.16)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.70)]">
                      Input
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">1 foto + metrics</p>
                  </div>
                  <div className="rounded-2xl bg-[rgba(255,255,255,0.10)] px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,0.22)] ring-1 ring-[rgba(255,255,255,0.16)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.70)]">
                      Output
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">Image / Video</p>
                  </div>
                  <div className="rounded-2xl bg-[rgba(255,255,255,0.10)] px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,0.22)] ring-1 ring-[rgba(255,255,255,0.16)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.70)]">
                      Accent
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">Tosca signal</p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      <div className="border-b border-border">
        <ProductSlider
          title="Sport picks"
          subtitle="Sport"
          products={sportProducts.slice(0, 12)}
        />
        <ProductSlider
          title="Casual essentials"
          subtitle="Casual"
          products={casualProducts.slice(0, 12)}
        />
      </div>

      <section className="py-12">
        <Container>
          <div className="group relative aspect-[21/9] overflow-hidden rounded-[34px] bg-surface shadow-soft ring-1 ring-border">
            <div className="absolute inset-0">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/assets/pixverse-video/luxury.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.68),rgba(0,0,0,0.20)_55%,rgba(0,0,0,0))]" />
              <div className="absolute -inset-32 bg-[radial-gradient(closest-side,rgba(31,183,173,0.28),transparent_70%)] opacity-70" />
            </div>
            <div className="relative flex h-full flex-col justify-end gap-3 p-7 sm:p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-white ring-1 ring-[rgba(255,255,255,0.22)] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgba(31,183,173,0.95)] shadow-[0_0_0_6px_rgba(31,183,173,0.16)]" />
                Luxury ads banner
              </div>
              <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-white">
                Tailored silhouettes
              </p>
              <p className="max-w-xl text-sm leading-6 text-[rgba(255,255,255,0.78)]">
                Copy kecil agar tidak menghalangi visual. Gradient overlay bantu readability.
              </p>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="w-fit rounded-full bg-[rgba(255,255,255,0.14)] px-4 py-2 text-sm font-medium text-white ring-1 ring-[rgba(255,255,255,0.22)] backdrop-blur">
                  Code: AURAFIT
                </div>
                <ButtonLink
                  href="/catalog"
                  variant="secondary"
                  size="md"
                  className={[
                    "relative isolate overflow-hidden",
                    "bg-transparent text-white ring-0",
                    "shadow-[0_18px_55px_rgba(0,0,0,0.32)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.44)] active:translate-y-0",
                    "before:absolute before:inset-0 before:-z-10 before:content-[''] before:rounded-full",
                    "before:bg-[linear-gradient(120deg,rgba(31,183,173,0.92),rgba(255,255,255,0.22),rgba(31,183,173,0.62))] before:opacity-80",
                    "after:absolute after:inset-px after:-z-10 after:content-[''] after:rounded-full after:bg-[rgba(255,255,255,0.12)] after:backdrop-blur",
                    "hover:after:bg-[rgba(255,255,255,0.16)]",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    Shop now
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      className="text-white/90"
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <div className="border-b border-border">
        <ProductSlider title="Women highlight" subtitle="Woman" products={womanProducts.slice(0, 12)} />
        <section className="py-12">
          <Container>
            <div className="group relative aspect-[21/9] overflow-hidden rounded-[34px] bg-surface shadow-soft ring-1 ring-border">
              <div className="absolute inset-0">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src="/assets/pixverse-video/kids-ad.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(11,14,18,0.62),rgba(11,14,18,0.18)_55%,rgba(11,14,18,0))]" />
                <div className="absolute -inset-32 bg-[radial-gradient(closest-side,rgba(31,183,173,0.26),transparent_70%)] opacity-70" />
              </div>
              <div className="relative flex h-full flex-col justify-end gap-3 p-7 sm:p-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-white ring-1 ring-[rgba(255,255,255,0.22)] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgba(31,183,173,0.95)] shadow-[0_0_0_6px_rgba(31,183,173,0.16)]" />
                  Kids campaign
                </div>
                <p className="max-w-2xl font-display text-3xl font-semibold tracking-[-0.04em] text-white">
                  Color. Motion. Play.
                </p>
                <p className="max-w-2xl text-sm leading-6 text-[rgba(255,255,255,0.78)]">
                  Modern kidswear dengan warna vibrant, pattern fun, dan material ringan untuk gerak aktif.
                </p>
                <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-fit rounded-full bg-[rgba(255,255,255,0.14)] px-4 py-2 text-sm font-medium text-white ring-1 ring-[rgba(255,255,255,0.22)] backdrop-blur">
                    Code: KIDSPOP
                  </div>
                  <ButtonLink
                    href="/catalog?q=kids"
                    variant="secondary"
                    size="md"
                    className={[
                      "relative isolate overflow-hidden",
                      "bg-transparent text-white ring-0",
                      "shadow-[0_18px_55px_rgba(0,0,0,0.32)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.44)] active:translate-y-0",
                      "before:absolute before:inset-0 before:-z-10 before:content-[''] before:rounded-full",
                      "before:bg-[linear-gradient(120deg,rgba(31,183,173,0.92),rgba(255,255,255,0.22),rgba(31,183,173,0.62))] before:opacity-80",
                      "after:absolute after:inset-px after:-z-10 after:content-[''] after:rounded-full after:bg-[rgba(255,255,255,0.12)] after:backdrop-blur",
                      "hover:after:bg-[rgba(255,255,255,0.16)]",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2">
                      Shop now
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="text-white/90"
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </ButtonLink>
                </div>
              </div>
            </div>
          </Container>
        </section>
        <ProductSlider title="Kids attire" subtitle="Kids" products={kidsProducts.slice(0, 12)} />
      </div>

      <section className="py-14">
        <Container>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Flow</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">
            Onboarding → Catalog → Try-on
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Apple-like minimal surface, bento grid cards, fokus pada hierarki dan spacing.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[34px] bg-surface p-7 shadow-soft ring-1 ring-border">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Onboarding</p>
              <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                1 photo. Realistic motion.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                User cukup upload 1 foto tampak depan + bio-metrics. Sistem membuat profil video (PixVerse) yang terasa seperti
                studio fitting — siap dipakai untuk try-on produk.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="flex items-start gap-3 rounded-3xl bg-surface-2 p-4 ring-1 ring-border">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgba(31,183,173,0.14)] ring-1 ring-[rgba(31,183,173,0.25)] text-sm font-semibold text-[rgba(8,79,76,0.92)]">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload front photo</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Pencahayaan rata, latar polos, kamera setinggi dada.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-3xl bg-surface-2 p-4 ring-1 ring-border">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgba(31,183,173,0.14)] ring-1 ring-[rgba(31,183,173,0.25)] text-sm font-semibold text-[rgba(8,79,76,0.92)]">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Generate profile video</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      PixVerse mengubah foto jadi video portrait 9:16 dengan gerak halus.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-3xl bg-surface-2 p-4 ring-1 ring-border">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgba(31,183,173,0.14)] ring-1 ring-[rgba(31,183,173,0.25)] text-sm font-semibold text-[rgba(8,79,76,0.92)]">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Try-on any product</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Ambil foto produk sebagai referensi, lalu generate video seolah kamu memakainya.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/onboarding" size="md">
                  Mulai onboarding
                </ButtonLink>
                <ButtonLink href="/catalog" variant="secondary" size="md">
                  Lihat catalog
                </ButtonLink>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[34px] bg-surface shadow-soft ring-1 ring-border">
              <div className="absolute inset-0">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src="/assets/pixverse-video/luxury.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,14,18,0.12),rgba(11,14,18,0.60))]" />
              </div>
              <div className="relative grid h-full place-items-center p-7">
                <div className="w-full max-w-[360px] overflow-hidden rounded-[34px] bg-[rgba(255,255,255,0.10)] p-4 ring-1 ring-[rgba(255,255,255,0.18)] backdrop-blur">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#ffffff,#eef2f7)] ring-1 ring-[rgba(255,255,255,0.22)]">
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      src="/assets/pixverse-video/sporty.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.22))]" />
                    <div className="absolute left-4 top-4 rounded-full bg-[rgba(255,255,255,0.78)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-foreground ring-1 ring-border">
                      PixVerse profile preview
                    </div>
                    <div className="absolute inset-x-0 bottom-4 grid place-items-center">
                      <div className="rounded-full bg-[rgba(31,183,173,0.14)] px-4 py-2 text-xs font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.28)] backdrop-blur">
                        Ready for try-on · 9:16
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.70)]">
                        Result
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">Profile video</p>
                    </div>
                    <div className="rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-2 text-xs font-medium text-white ring-1 ring-[rgba(255,255,255,0.20)] backdrop-blur">
                      Size: S/M/L/XL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-12">
            <BentoCard
              title="Body mapping scan"
              description="Masukkan bio-metrics + 1 foto tampak depan. Sistem menampilkan efek scanning AuraFit."
              className="lg:col-span-7"
            >
              <div className="relative h-36 overflow-hidden rounded-3xl ring-1 ring-border">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src="/assets/pixverse-video/kids-ad.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,14,18,0.38),transparent_60%)]" />
                <div className="absolute left-5 top-5 rounded-full bg-[rgba(255,255,255,0.78)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-foreground ring-1 ring-border">
                  Scan overlay
                </div>
              </div>
            </BentoCard>

            <BentoCard
              title="Discovery catalog"
              description="Produk tampil di manekin digital standar, seperti e-commerce premium."
              className="lg:col-span-5"
            >
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl bg-surface-2 ring-1 ring-border"
                  />
                ))}
              </div>
            </BentoCard>
          </div>
        </Container>
      </section>

      <footer className="border-t border-border bg-surface">
        <Container className="py-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgba(31,183,173,0.14)] ring-1 ring-[rgba(31,183,173,0.25)]">
                  <span className="font-display text-sm font-semibold tracking-[-0.06em] text-[rgba(8,79,76,0.92)]">
                    AF
                  </span>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                    AuraFit AI
                  </p>
                  <p className="text-sm text-muted">Premium e-commerce try-on powered by PixVerse.</p>
                </div>
              </div>

              <p className="mt-6 max-w-xl text-sm leading-6 text-muted">
                Dari onboarding 1 foto sampai try-on video 9:16. Fokus pada visual matte, teal accents,
                dan pengalaman belanja yang terasa premium.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/onboarding" size="md">
                  Mulai onboarding
                </ButtonLink>
                <ButtonLink href="/catalog" variant="secondary" size="md">
                  Explore catalog
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Product</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <Link href="/catalog" className="text-foreground/80 transition-colors hover:text-foreground">
                    Catalog
                  </Link>
                  <Link href="/onboarding" className="text-foreground/80 transition-colors hover:text-foreground">
                    Onboarding
                  </Link>
                  <Link href="/cart" className="text-foreground/80 transition-colors hover:text-foreground">
                    Cart
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Company</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <Link href="/admin/login" className="text-foreground/80 transition-colors hover:text-foreground">
                    Admin
                  </Link>
                  <Link href="/checkout" className="text-foreground/80 transition-colors hover:text-foreground">
                    Checkout
                  </Link>
                  <Link href="/login" className="text-foreground/80 transition-colors hover:text-foreground">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} AuraFit AI. All rights reserved.</p>
            <p className="text-muted">Built for PixVerse Hackathon.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

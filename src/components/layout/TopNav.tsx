 "use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import {
  avatarGradientFromSeed,
  clearUserStorage,
  initialsFromName,
  readUserFromStorage,
  type UserIdentity,
} from "@/lib/user";

export function TopNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/catalog") return;
    const params = new URLSearchParams(window.location.search);
    const frame = window.requestAnimationFrame(() => setQuery(params.get("q") ?? ""));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setUser(readUserFromStorage());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function loadCartCount() {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { count?: number };
      setCartCount(typeof body.count === "number" ? body.count : 0);
    } catch {
      setCartCount(0);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadCartCount();
    });
    const onUpdate = () => void loadCartCount();
    window.addEventListener("aurafit-cart-updated", onUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("aurafit-cart-updated", onUpdate);
    };
  }, [pathname]);

  const navItems = useMemo(
    () => [
      { href: "/catalog", label: "Catalog" },
      { href: "/onboarding", label: "Onboarding" },
    ],
    [],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams(window.location.search);
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.push(qs ? `/catalog?${qs}` : "/catalog");
  }

  async function logout() {
    setMenuOpen(false);
    await fetch("/api/user/logout", { method: "POST" }).catch(() => null);
    clearUserStorage();
    setUser(null);
    window.dispatchEvent(new Event("aurafit-cart-updated"));
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[rgba(247,248,250,0.88)] backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,transparent,rgba(31,183,173,0.65),transparent)]" />
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(31,183,173,0.92),rgba(31,183,173,0.34),rgba(255,255,255,0.12))] shadow-[0_18px_45px_rgba(31,183,173,0.18)] ring-1 ring-[rgba(13,20,32,0.14)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.60),transparent_55%)]" />
              <span className="absolute -inset-6 bg-[radial-gradient(circle_at_80%_85%,rgba(8,79,76,0.28),transparent_60%)]" />
              <span className="relative font-display text-[13px] font-semibold tracking-[-0.06em] text-[rgba(8,79,76,0.92)]">
                AF
              </span>
            </span>
            <span className="max-w-[9rem] truncate whitespace-nowrap font-display text-lg font-semibold tracking-[-0.04em] text-transparent bg-clip-text bg-[linear-gradient(90deg,rgba(15,23,42,0.92),rgba(8,79,76,0.94),rgba(31,183,173,0.95))] transition-[filter] group-hover:brightness-110 lg:max-w-none">
              AuraFit AI
            </span>
          </Link>

          <nav className="hidden items-center gap-2 text-sm md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative whitespace-nowrap rounded-full px-3 py-2 font-medium tracking-[-0.01em] transition-colors lg:px-4",
                    isActive
                      ? "text-foreground bg-surface ring-1 ring-border shadow-soft"
                      : "text-muted hover:text-foreground hover:bg-surface-2",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <form
          onSubmit={onSubmit}
          className="hidden flex-1 min-w-0 max-w-[520px] items-center gap-3 rounded-full bg-surface px-4 py-2 shadow-soft ring-1 ring-border md:flex"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted"
            aria-hidden="true"
          >
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M16.2 16.2 21 21"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, brand, jacket…"
            className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full bg-[rgba(31,183,173,0.12)] px-3 py-1 text-[11px] font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)]">
              Enter
            </span>
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-3">
          {rightSlot}
          <Link
            href="/cart"
            className="relative hidden h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-foreground shadow-soft ring-1 ring-border transition-colors hover:bg-surface-2 md:inline-flex"
            aria-label="Cart"
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
                d="M6.5 8.5h14l-1.2 7.2a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6.1 4.5H3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                fill="currentColor"
              />
            </svg>
            Cart
            {cartCount > 0 ? (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid h-10 w-10 place-items-center overflow-hidden rounded-full ring-1 ring-border shadow-soft"
                style={{ backgroundImage: avatarGradientFromSeed(user.avatar_seed) }}
                aria-label="User menu"
              >
                <span className="text-sm font-semibold text-white">{initialsFromName(user.name)}</span>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-border">
                  <div className="px-5 py-4">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="mt-1 text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="border-t border-border p-2">
                    <Link
                      href="/cart"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-medium text-foreground hover:bg-surface-2"
                    >
                      Cart
                      {cartCount > 0 ? (
                        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[rgba(31,183,173,0.14)] px-2 text-xs text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)]">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      ) : null}
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex h-11 items-center rounded-2xl px-4 text-sm font-medium text-foreground hover:bg-surface-2"
                    >
                      Checkout
                    </Link>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="mt-1 flex h-11 w-full items-center rounded-2xl px-4 text-sm font-medium text-foreground hover:bg-surface-2"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <ButtonLink href={`/login?next=${encodeURIComponent(pathname ?? "/")}`} variant="secondary" size="sm">
              Sign in
            </ButtonLink>
          )}

          <ButtonLink href="/onboarding" variant="secondary" size="sm">
            Start Scan
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}

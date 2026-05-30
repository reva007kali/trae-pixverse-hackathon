"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { safeFirstProductImageUrl } from "@/lib/images";

type CartProduct = {
  id: string;
  name: string;
  brand: string;
  price_cents: number;
  currency: string;
  mannequin_media_urls: unknown;
  category: string;
};

type CartItem = {
  id: string;
  quantity: number;
  product: CartProduct | null;
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

export function CartView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("USD");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Gagal memuat cart.");
      }
      const body = (await res.json()) as { items: CartItem[]; currency: string };
      setItems(body.items);
      setCurrency(body.currency ?? "USD");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const totals = useMemo(() => {
    let totalCents = 0;
    for (const item of items) {
      if (item.product) totalCents += item.product.price_cents * item.quantity;
    }
    return { totalCents };
  }, [items]);

  async function updateQty(itemId: string, quantity: number) {
    setError(null);
    const next = items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    setItems(next);
    const res = await fetch("/api/cart", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
    if (!res.ok) await load();
    window.dispatchEvent(new Event("aurafit-cart-updated"));
  }

  async function removeItem(itemId: string) {
    setError(null);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    });
    if (!res.ok) await load();
    window.dispatchEvent(new Event("aurafit-cart-updated"));
  }

  if (loading) {
    return (
      <div className="rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="text-sm text-muted">Loading cart…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">Cart</p>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button type="button" variant="secondary" className="mt-6" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">Cart</p>
        <p className="mt-2 text-sm leading-6 text-muted">Cart kamu masih kosong. Cari produk dan add ke cart.</p>
        <ButtonLink href="/catalog" variant="primary" className="mt-6">
          Browse catalog
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[34px] bg-surface shadow-soft ring-1 ring-border">
        <div className="flex items-start justify-between gap-6 border-b border-border px-8 py-7">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Cart</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Items to checkout
            </p>
          </div>
          <ButtonLink href="/catalog" variant="secondary">
            Continue shopping
          </ButtonLink>
        </div>

        <div className="divide-y divide-border">
          {items.map((item) => {
            const product = item.product;
            const img = product ? safeFirstProductImageUrl(product.mannequin_media_urls) : null;
            return (
              <div key={item.id} className="flex flex-col gap-5 px-8 py-7 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative aspect-square h-20 w-20 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border">
                    {img ? (
                      <Image src={img} alt={product?.name ?? "Product"} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">{product?.brand ?? "—"}</p>
                    <p className="mt-2 truncate font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                      {product ? <Link href={`/product/${product.id}`}>{product.name}</Link> : "Product"}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {product ? formatPrice(product.price_cents, product.currency) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-2 rounded-full bg-surface-2 p-1 ring-1 ring-border">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-surface"
                      onClick={() => void updateQty(item.id, Math.max(1, item.quantity - 1))}
                      aria-label="Decrease quantity"
                    >
                      <span className="text-lg leading-none">−</span>
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-surface"
                      onClick={() => void updateQty(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <span className="text-lg leading-none">+</span>
                    </button>
                  </div>

                  <Button type="button" variant="ghost" onClick={() => void removeItem(item.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-fit rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Summary</p>
        <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Checkout</p>
        <div className="mt-7 grid gap-3 text-sm text-muted">
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span className="text-foreground">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="text-foreground">{formatPrice(totals.totalCents, currency)}</span>
          </div>
        </div>
        <ButtonLink href="/checkout" size="lg" className="mt-8 w-full">
          Proceed to payment
        </ButtonLink>
      </div>
    </div>
  );
}

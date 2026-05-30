"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { safeFirstProductImageUrl } from "@/lib/images";
import { readUserFromStorage } from "@/lib/user";

type CartProduct = {
  id: string;
  name: string;
  brand: string;
  price_cents: number;
  currency: string;
  mannequin_media_urls: unknown;
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

export function CheckoutView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [name, setName] = useState(() => readUserFromStorage()?.name ?? "");
  const [email, setEmail] = useState(() => readUserFromStorage()?.email ?? "");

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
      setError(err instanceof Error ? err.message : "Gagal memuat checkout.");
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

  async function payNow(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Payment gagal.");
      }

      const body = (await res.json()) as { order_id: string };
      window.dispatchEvent(new Event("aurafit-cart-updated"));
      router.push(`/checkout/success?order=${body.order_id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="text-sm text-muted">Preparing checkout…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">Checkout</p>
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
        <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">Checkout</p>
        <p className="mt-2 text-sm leading-6 text-muted">Cart kosong.</p>
        <ButtonLink href="/catalog" className="mt-6">
          Browse catalog
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="h-fit rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Payment</p>
        <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Complete checkout
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">Simulasi payment: klik pay untuk langsung sukses.</p>

        <form onSubmit={payNow} className="mt-7 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-muted">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="mt-2 rounded-3xl bg-surface-2 p-5 ring-1 ring-border">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Method</p>
            <p className="mt-2 text-sm font-medium text-foreground">Card / VA / QRIS (placeholder)</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Card", "VA", "QRIS"].map((label) => (
                <div
                  key={label}
                  className="grid h-11 place-items-center rounded-2xl bg-surface ring-1 ring-border text-sm text-muted"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" size="lg" disabled={submitting || !name.trim() || !email.trim()}>
            {submitting ? "Processing…" : `Pay now • ${formatPrice(totals.totalCents, currency)}`}
          </Button>

          <ButtonLink href="/cart" variant="secondary" className="w-full">
            Back to cart
          </ButtonLink>
        </form>
      </div>

      <div className="rounded-[34px] bg-surface shadow-soft ring-1 ring-border">
        <div className="border-b border-border px-8 py-7">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Order summary</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Items
          </p>
        </div>
        <div className="divide-y divide-border">
          {items.map((item) => {
            const product = item.product;
            const img = product ? safeFirstProductImageUrl(product.mannequin_media_urls) : null;
            return (
              <div key={item.id} className="flex items-center gap-4 px-8 py-6">
                <div className="relative aspect-square h-16 w-16 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border">
                  {img ? (
                    <Image src={img} alt={product?.name ?? "Product"} fill sizes="64px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                    {product?.name ?? "Product"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {product ? `${product.brand} • Qty ${item.quantity}` : `Qty ${item.quantity}`}
                  </p>
                </div>
                <p className="text-sm text-foreground">
                  {product ? formatPrice(product.price_cents * item.quantity, product.currency) : null}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

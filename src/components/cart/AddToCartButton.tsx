"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function AddToCartButton({
  productId,
  quantity = 1,
  className,
}: {
  productId: string;
  quantity?: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setLoading(true);
    setAdded(false);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Gagal add to cart.");
      }

      setAdded(true);
      window.dispatchEvent(new Event("aurafit-cart-updated"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal add to cart.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" size="lg" onClick={() => void add()} disabled={loading} className={className}>
        {loading ? "Adding…" : added ? "Added" : "Add to cart"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

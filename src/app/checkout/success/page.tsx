import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { ButtonLink } from "@/components/ui/Button";
import { safeFirstProductImageUrl } from "@/lib/images";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getUserSessionId } from "@/lib/user-session";

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

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ order?: string }>;
}) {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) redirect("/login?next=/checkout");

  const orderId = (await searchParams)?.order?.toString() ?? "";
  if (!orderId) notFound();

  const supabase = createSupabaseServiceClient();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id,session_id,name,email,total_cents,currency,status,created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) notFound();
  if (order.session_id !== sessionId) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id,quantity,unit_price_cents,currency,product:products(id,name,brand,mannequin_media_urls)")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  const lineItems =
    (items ?? []).map((row) => {
      const product = row.product as unknown as {
        id: string;
        name: string;
        brand: string;
        mannequin_media_urls: unknown;
      } | null;
      return {
        id: row.id as string,
        quantity: row.quantity as number,
        unit_price_cents: row.unit_price_cents as number,
        currency: row.currency as string,
        product,
      };
    }) ?? [];

  return (
    <div className="flex-1 bg-background">
      <TopNav />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl rounded-[34px] bg-surface p-10 shadow-soft ring-1 ring-border">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Payment</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">
                Success
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted">
                Order kamu sudah tercatat sebagai <span className="font-medium text-foreground">paid</span>. Ini
                simulasi untuk prototype.
              </p>
            </div>
            <div className="rounded-3xl bg-surface-2 px-6 py-5 ring-1 ring-border">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Total</p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {formatPrice(order.total_cents, order.currency)}
              </p>
              <p className="mt-2 text-xs text-muted">
                Order ID <span className="font-medium text-foreground">{order.id}</span>
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] ring-1 ring-border">
            <div className="bg-surface-2 px-7 py-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Items</p>
            </div>
            <div className="divide-y divide-border">
              {lineItems.map((item) => {
                const product = item.product;
                const img = product ? safeFirstProductImageUrl(product.mannequin_media_urls) : null;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-7 py-5">
                    <div className="relative aspect-square h-16 w-16 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border">
                      {img ? (
                        <Image src={img} alt={product?.name ?? "Product"} fill sizes="64px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                        {product ? <Link href={`/product/${product.id}`}>{product.name}</Link> : "Product"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {product ? `${product.brand} • Qty ${item.quantity}` : `Qty ${item.quantity}`}
                      </p>
                    </div>
                    <p className="text-sm text-foreground">
                      {formatPrice(item.unit_price_cents * item.quantity, item.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/catalog" variant="primary" size="lg">
              Continue shopping
            </ButtonLink>
            <ButtonLink href="/cart" variant="secondary" size="lg">
              View cart
            </ButtonLink>
          </div>

          <div className="mt-10 rounded-3xl bg-surface-2 px-7 py-6 ring-1 ring-border">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Customer</p>
            <p className="mt-2 text-sm text-foreground">{order.name}</p>
            <p className="mt-1 text-sm text-muted">{order.email}</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

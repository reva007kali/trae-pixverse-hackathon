import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getUserSessionId } from "@/lib/user-session";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) return jsonError("Silakan login dulu.", 401);

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!name || !email) return jsonError("Name dan email wajib diisi.");

  const supabase = createSupabaseServiceClient();
  const { data: items, error: itemsErr } = await supabase
    .from("cart_items")
    .select("id,quantity,product:products(id,price_cents,currency)")
    .eq("session_id", sessionId);

  if (itemsErr) return jsonError(itemsErr.message, 500);

  const cart = (items ?? [])
    .map((row) => {
      const product = row.product as unknown as {
        id: string;
        price_cents: number;
        currency: string;
      } | null;
      return {
        quantity: row.quantity as number,
        product,
      };
    })
    .filter((r) => r.product);

  if (cart.length === 0) return jsonError("Cart kosong.");

  let totalCents = 0;
  let currency = "USD";
  for (const item of cart) {
    currency = item.product?.currency ?? currency;
    totalCents += (item.product?.price_cents ?? 0) * item.quantity;
  }

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      session_id: sessionId,
      name,
      email,
      status: "paid",
      currency,
      total_cents: totalCents,
    })
    .select("id")
    .single();

  if (orderErr) return jsonError(orderErr.message, 500);

  const orderId = orderRow.id as string;

  const orderItems = cart.map((item) => ({
    order_id: orderId,
    product_id: item.product!.id,
    quantity: item.quantity,
    unit_price_cents: item.product!.price_cents,
    currency: item.product!.currency,
  }));

  const { error: itemsInsertErr } = await supabase.from("order_items").insert(orderItems);
  if (itemsInsertErr) return jsonError(itemsInsertErr.message, 500);

  const { error: clearErr } = await supabase.from("cart_items").delete().eq("session_id", sessionId);
  if (clearErr) return jsonError(clearErr.message, 500);

  return NextResponse.json({ ok: true, order_id: orderId });
}

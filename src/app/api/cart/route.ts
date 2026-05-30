import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getUserSessionId } from "@/lib/user-session";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) {
    return NextResponse.json({ items: [], count: 0, total_cents: 0, currency: "USD" });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "id,quantity,product:products(id,name,brand,price_cents,currency,mannequin_media_urls,category)"
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);

  const items = (data ?? []).map((row) => {
    const product = row.product as unknown as {
      id: string;
      name: string;
      brand: string;
      price_cents: number;
      currency: string;
      mannequin_media_urls: unknown;
      category: string;
    } | null;
    return {
      id: row.id as string,
      quantity: row.quantity as number,
      product,
    };
  });

  let total = 0;
  let currency = "USD";
  for (const item of items) {
    if (item.product) {
      currency = item.product.currency ?? currency;
      total += item.product.price_cents * item.quantity;
    }
  }

  return NextResponse.json({
    items,
    count: items.reduce((acc, i) => acc + i.quantity, 0),
    total_cents: total,
    currency,
  });
}

export async function POST(req: Request) {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) return jsonError("Silakan login dulu.", 401);

  const body = await req.json().catch(() => null);
  const productId = typeof body?.product_id === "string" ? body.product_id : "";
  const rawQty = typeof body?.quantity === "number" ? body.quantity : 1;
  const quantity = Number.isFinite(rawQty) ? Math.max(1, Math.floor(rawQty)) : 1;
  if (!productId) return jsonError("product_id wajib diisi.");

  const supabase = createSupabaseServiceClient();
  const { data: existing, error: existingErr } = await supabase
    .from("cart_items")
    .select("id,quantity")
    .eq("session_id", sessionId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingErr) return jsonError(existingErr.message, 500);

  if (existing?.id) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: (existing.quantity ?? 0) + quantity })
      .eq("id", existing.id);
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("cart_items")
    .insert({ session_id: sessionId, product_id: productId, quantity });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) return jsonError("Silakan login dulu.", 401);

  const body = await req.json().catch(() => null);
  const itemId = typeof body?.item_id === "string" ? body.item_id : "";
  const rawQty = typeof body?.quantity === "number" ? body.quantity : NaN;
  const quantity = Number.isFinite(rawQty) ? Math.max(1, Math.floor(rawQty)) : NaN;
  if (!itemId || !Number.isFinite(quantity)) return jsonError("item_id dan quantity wajib diisi.");

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("session_id", sessionId);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) return jsonError("Silakan login dulu.", 401);

  const body = await req.json().catch(() => null);
  const itemId = typeof body?.item_id === "string" ? body.item_id : "";
  if (!itemId) return jsonError("item_id wajib diisi.");

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId).eq("session_id", sessionId);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServiceClient();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      category: body.category,
      name: body.name,
      brand: body.brand,
      price_cents: body.price_cents,
      currency: body.currency ?? "USD",
      tags: body.tags ?? [],
      mannequin_media_urls: [],
      description: body.description ?? "",
      fit_notes: body.fit_notes ?? "",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

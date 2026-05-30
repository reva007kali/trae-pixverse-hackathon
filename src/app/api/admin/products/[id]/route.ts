import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Invalid body." }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("products")
    .update({
      category: body.category,
      name: body.name,
      brand: body.brand,
      price_cents: body.price_cents,
      currency: body.currency ?? "USD",
      tags: body.tags ?? [],
      description: body.description ?? "",
      fit_notes: body.fit_notes ?? "",
    })
    .eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


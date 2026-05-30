import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "Missing file." }, { status: 400 });
  }

  const fileName = (file as File).name || "image.jpg";
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg";
  const path = `products/${id}/${Date.now()}.${ext}`;

  const supabase = createSupabaseServiceClient();
  const upload = await supabase.storage.from("product-images").upload(path, file as File, {
    upsert: true,
    cacheControl: "31536000",
    contentType: (file as File).type || "application/octet-stream",
  });

  if (upload.error) {
    return NextResponse.json({ message: upload.error.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;

  const { data: existing, error: selectError } = await supabase
    .from("products")
    .select("mannequin_media_urls")
    .eq("id", id)
    .single();

  if (selectError) {
    return NextResponse.json({ message: selectError.message }, { status: 500 });
  }

  const urls = Array.isArray(existing?.mannequin_media_urls) ? existing.mannequin_media_urls : [];
  const nextUrls = [publicUrl, ...urls.filter((u: unknown) => u !== publicUrl)];

  const { error: updateError } = await supabase
    .from("products")
    .update({ mannequin_media_urls: nextUrls })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl, bucket: "product-images", path });
}

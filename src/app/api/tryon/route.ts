import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { safeFirstProductImageUrl } from "@/lib/images";

export const maxDuration = 300;

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function extFromContentType(contentType: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "jpg";
}
async function runPixverseCreateReferenceVideo(input: {
  prompt: string;
  imagePaths: string[];
  model: string;
  quality: string;
  aspectRatio: string;
}) {
  const args = [
    "create",
    "reference",
    "--images",
    ...input.imagePaths,
    "--prompt",
    input.prompt,
    "--model",
    input.model,
    "--quality",
    input.quality,
    "--aspect-ratio",
    input.aspectRatio,
    "--json",
  ];

  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn("pixverse", args, { env: process.env });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("PixVerse CLI belum ter-install. Jalankan: npm install -g pixverse"));
        return;
      }
      reject(err);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `PixVerse gagal (exit code ${code}).`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as Record<string, unknown>);
      } catch {
        reject(new Error("Output PixVerse tidak valid (bukan JSON)."));
      }
    });
  });
}

function buildPrompt(input: { productName: string; brand: string; category: string }) {
  const categoryHint =
    input.category === "sport"
      ? "sportwear, activewear"
      : input.category === "casual"
        ? "casualwear, streetwear"
        : input.category === "woman"
          ? "women fashion, premium minimal"
          : input.category === "man"
            ? "men fashion, premium minimal"
            : input.category === "kids"
              ? "kids fashion, vibrant and fun"
              : `${input.category} fashion`;

  return [
    "Image-to-video try-on, ultra realistic.",
    `The person in the photo wearing ${input.productName} by ${input.brand}.`,
    categoryHint + ".",
    "Subtle camera movement, natural fabric motion, stable face, no text, no watermark.",
  ].join(" ");
}

export async function POST(req: Request) {
  let userTempFile: string | null = null;
  let productTempFile: string | null = null;
  try {
    const body = (await req.json().catch(() => null)) as
      | { user_profile_id?: string; product_id?: string }
      | null;
    const userProfileId = safeString(body?.user_profile_id);
    const productId = safeString(body?.product_id);
    if (!userProfileId || !productId) {
      return NextResponse.json({ message: "Missing user_profile_id atau product_id." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const bucket = supabase.storage.from("product-images");

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userProfileId)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ message: profileError?.message ?? "User profile tidak ditemukan." }, { status: 404 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();
    if (productError || !product) {
      return NextResponse.json({ message: productError?.message ?? "Product tidak ditemukan." }, { status: 404 });
    }

    const frontPath = safeString((profile as Record<string, unknown>).photo_front_path);
    if (!frontPath) {
      return NextResponse.json({ message: "Photo front path kosong." }, { status: 400 });
    }

    const frontUrl = frontPath.startsWith("http") ? frontPath : bucket.getPublicUrl(frontPath).data.publicUrl;

    const imageRes = await fetch(frontUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ message: "Gagal download photo input." }, { status: 500 });
    }

    const bytes = await imageRes.arrayBuffer();
    const ext = extFromContentType(imageRes.headers.get("content-type"));
    userTempFile = path.join(os.tmpdir(), `aurafit-tryon-user-${userProfileId}.${ext}`);
    await writeFile(userTempFile, Buffer.from(bytes));

    const productImageUrl = safeFirstProductImageUrl((product as Record<string, unknown>).mannequin_media_urls);
    if (!productImageUrl) {
      return NextResponse.json({ message: "Product belum punya image untuk dijadikan referensi." }, { status: 400 });
    }

    const productImageRes = await fetch(productImageUrl);
    if (!productImageRes.ok) {
      return NextResponse.json({ message: "Gagal download product image." }, { status: 500 });
    }

    const productBytes = await productImageRes.arrayBuffer();
    const productExt = extFromContentType(productImageRes.headers.get("content-type"));
    productTempFile = path.join(os.tmpdir(), `aurafit-tryon-product-${productId}.${productExt}`);
    await writeFile(productTempFile, Buffer.from(productBytes));

    const prompt = buildPrompt({
      productName: String((product as Record<string, unknown>).name ?? ""),
      brand: String((product as Record<string, unknown>).brand ?? ""),
      category: String((product as Record<string, unknown>).category ?? ""),
    });

    const model = process.env.PIXVERSE_VIDEO_MODEL ?? "v6";
    const quality = process.env.PIXVERSE_VIDEO_QUALITY ?? "720p";
    const aspectRatio = process.env.PIXVERSE_TRYON_ASPECT_RATIO ?? "9:16";

    const result = await runPixverseCreateReferenceVideo({
      prompt: `@image1 is the user. Apply the outfit/style from @image2 to @image1. ${prompt}`,
      imagePaths: [userTempFile, productTempFile],
      model,
      quality,
      aspectRatio,
    });

    const remoteVideoUrl =
      safeString((result as Record<string, unknown>).video_url) ??
      safeString((result as Record<string, unknown>).url) ??
      safeString((result as Record<string, unknown>).video);

    if (!remoteVideoUrl || !remoteVideoUrl.startsWith("http")) {
      return NextResponse.json({ message: "PixVerse tidak mengembalikan video_url." }, { status: 500 });
    }

    const videoRes = await fetch(remoteVideoUrl);
    if (!videoRes.ok) {
      return NextResponse.json({ message: "Gagal download video dari PixVerse." }, { status: 500 });
    }

    const videoBytes = await videoRes.arrayBuffer();
    const outPath = `tryon/results/${userProfileId}/${productId}/pixverse-${Date.now()}.mp4`;
    const upload = await bucket.upload(outPath, Buffer.from(videoBytes), {
      upsert: true,
      cacheControl: "31536000",
      contentType: "video/mp4",
    });
    if (upload.error) {
      return NextResponse.json({ message: upload.error.message }, { status: 500 });
    }

    const publicUrl = bucket.getPublicUrl(outPath).data.publicUrl;

    const { error: insertError } = await supabase.from("tryon_results").insert({
      user_id: null,
      user_profile_id: userProfileId,
      product_id: productId,
      result_type: "video",
      result_path: publicUrl,
    });

    if (insertError) {
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ video_url: publicUrl, prompt });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Gagal generate try-on." },
      { status: 500 },
    );
  } finally {
    if (userTempFile) {
      await unlink(userTempFile).catch(() => null);
    }
    if (productTempFile) {
      await unlink(productTempFile).catch(() => null);
    }
  }
}

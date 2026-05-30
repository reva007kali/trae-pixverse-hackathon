import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const maxDuration = 300;

const require = createRequire(import.meta.url);

function pixverseBinPath(): string {
  const override = process.env.PIXVERSE_BIN?.trim();
  if (override) return override;
  try {
    const pkg = require.resolve("pixverse/package.json");
    const nodeModulesDir = path.resolve(path.dirname(pkg), "..");
    return path.join(
      nodeModulesDir,
      ".bin",
      process.platform === "win32" ? "pixverse.cmd" : "pixverse",
    );
  } catch {
    return process.platform === "win32" ? "pixverse.cmd" : "pixverse";
  }
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0) as string[];
}

function extFromContentType(contentType: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "jpg";
}

async function runPixverseCreateImage(prompt: string) {
  const quality = process.env.PIXVERSE_IMAGE_QUALITY ?? "1440p";
  const args = [
    "create",
    "image",
    "--prompt",
    prompt,
    "--aspect-ratio",
    "1:1",
    "--quality",
    quality,
    "--json",
  ];

  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(pixverseBinPath(), args, {
      env: process.env,
    });

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
        reject(new Error("PixVerse CLI belum tersedia. Pastikan dependency 'pixverse' ter-install."));
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
        const json = JSON.parse(stdout);
        resolve(json as Record<string, unknown>);
      } catch {
        reject(new Error("Output PixVerse tidak valid (bukan JSON)."));
      }
    });
  });
}

function buildPrompt(input: { name: string; brand: string; category: string }) {
  const categoryHint =
    input.category === "sport"
      ? "sportwear, activewear, performance fabric"
      : input.category === "casual"
        ? "casualwear, streetwear minimal"
        : input.category === "woman"
          ? "women fashion, premium minimal, elegant"
          : input.category === "man"
            ? "men fashion, premium minimal, modern"
            : `${input.category} fashion, premium`;

  return [
    "Studio product photo for ecommerce, ultra realistic.",
    `${input.name} by ${input.brand}.`,
    categoryHint + ".",
    "Clean seamless background, softbox lighting, subtle shadow on the floor, centered composition, sharp focus, high detail.",
    "No text, no watermark, no logo overlay, no model, no mannequin, no hands.",
  ].join(" ");
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createSupabaseServiceClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ message: productError?.message ?? "Product tidak ditemukan." }, { status: 404 });
  }

  const prompt = buildPrompt({
    name: String((product as Record<string, unknown>).name ?? ""),
    brand: String((product as Record<string, unknown>).brand ?? ""),
    category: String((product as Record<string, unknown>).category ?? ""),
  });

  let result: Record<string, unknown>;
  try {
    result = await runPixverseCreateImage(prompt);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Gagal generate image via PixVerse." },
      { status: 500 },
    );
  }

  const imageUrl = result.image_url;
  if (typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
    return NextResponse.json({ message: "PixVerse tidak mengembalikan image_url." }, { status: 500 });
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return NextResponse.json({ message: "Gagal download image dari PixVerse." }, { status: 500 });
  }

  const bytes = await imageRes.arrayBuffer();
  const contentType = imageRes.headers.get("content-type");
  const ext = extFromContentType(contentType);
  const path = `products/${id}/pixverse-${Date.now()}.${ext}`;

  const upload = await supabase.storage.from("product-images").upload(path, Buffer.from(bytes), {
    upsert: true,
    cacheControl: "31536000",
    contentType: contentType ?? "application/octet-stream",
  });

  if (upload.error) {
    return NextResponse.json({ message: upload.error.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  const existingUrls = safeStringArray((product as Record<string, unknown>).mannequin_media_urls);
  const urls = [publicUrl, ...existingUrls.filter((u) => u !== publicUrl)].slice(0, 8);

  const { error: updateError } = await supabase
    .from("products")
    .update({ mannequin_media_urls: urls })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ image_url: publicUrl, bucket: "product-images", path, prompt });
}

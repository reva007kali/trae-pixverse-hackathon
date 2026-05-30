import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const maxDuration = 300;

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing ${label}.`);
  }
  return value.trim();
}

function parsePositiveNumber(value: unknown, label: string) {
  const str = requiredString(value, label);
  const num = Number(str);
  if (!Number.isFinite(num) || num <= 0) throw new Error(`Invalid ${label}.`);
  return num;
}

function extFromFile(file: File) {
  const name = file.name || "image.jpg";
  const ext = name.includes(".") ? name.split(".").pop() : "jpg";
  if (!ext) return "jpg";
  return ext.toLowerCase();
}

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function pixverseCommand(): { command: string; prefixArgs: string[] } {
  const override = safeString(process.env.PIXVERSE_BIN);
  if (override) return { command: override, prefixArgs: [] };
  const entry = path.join(process.cwd(), "node_modules", "pixverse", "dist", "index.js");
  return { command: process.execPath, prefixArgs: [entry] };
}

function recommendSize(heightCm: number, weightKg: number): "S" | "M" | "L" | "XL" {
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;
  if (bmi < 19.5) return "S";
  if (bmi < 24.5) return "M";
  if (bmi < 29.5) return "L";
  return "XL";
}

async function runPixverseCreateVideo(input: {
  prompt: string;
  imagePath: string;
  model: string;
  quality: string;
  aspectRatio: string;
}) {
  const args = [
    "create",
    "video",
    "--prompt",
    input.prompt,
    "--image",
    input.imagePath,
    "--model",
    input.model,
    "--quality",
    input.quality,
    "--aspect-ratio",
    input.aspectRatio,
    "--json",
  ];

  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    const cmd = pixverseCommand();
    const child = spawn(cmd.command, [...cmd.prefixArgs, ...args], { env: process.env });
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
        reject(new Error("PixVerse CLI belum tersedia. Pastikan dependency 'pixverse' ter-install dan ter-deploy di runtime."));
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

function buildProfilePrompt(input: {
  heightCm: number;
  ageYears: number;
  weightKg: number;
  size: "S" | "M" | "L" | "XL";
}) {
  return [
    "Ultra realistic full-body image-to-video.",
    "Use the person in the photo as reference, keep face and body identity consistent.",
    "Neutral studio background, soft even lighting.",
    "Slow subtle camera movement, the person standing naturally, slight turn, natural cloth motion.",
    `Wardrobe fitting preview, recommended size ${input.size}.`,
    "No text, no watermark, no logo.",
  ].join(" ");
}

export async function POST(req: Request) {
  let tempFile: string | null = null;
  try {
    const form = await req.formData();

    const heightCm = parsePositiveNumber(form.get("heightCm"), "heightCm");
    const ageYears = parsePositiveNumber(form.get("ageYears"), "ageYears");
    const weightKg = parsePositiveNumber(form.get("weightKg"), "weightKg");
    const waistRaw = form.get("waistCm");
    const waistCm =
      typeof waistRaw === "string" && waistRaw.trim().length > 0 ? Number(waistRaw) : null;

    const front = form.get("front");
    if (!front || typeof front === "string") throw new Error("Missing front photo.");

    const profileId = randomUUID();
    const size = recommendSize(heightCm, weightKg);

    const supabase = createSupabaseServiceClient();
    const bucket = supabase.storage.from("product-images");

    const paths: Record<string, string> = {};
    const urls: Record<string, string> = {};

    const frontExt = extFromFile(front as File);
    const frontPath = `tryon/inputs/${profileId}/front.${frontExt}`;
    const upload = await bucket.upload(frontPath, front as File, {
      upsert: true,
      cacheControl: "31536000",
      contentType: (front as File).type || "application/octet-stream",
    });
    if (upload.error) throw new Error(upload.error.message);

    const frontUrl = bucket.getPublicUrl(frontPath).data.publicUrl;
    paths.front = frontPath;
    paths.back = frontPath;
    paths.right = frontPath;
    paths.left = frontPath;
    urls.front = frontUrl;
    urls.back = frontUrl;
    urls.right = frontUrl;
    urls.left = frontUrl;

    const { error: insertError } = await supabase.from("user_profiles").insert({
      id: profileId,
      user_id: null,
      height_cm: heightCm,
      age_years: ageYears,
      weight_kg: weightKg,
      waist_cm: Number.isFinite(waistCm) ? waistCm : null,
      photo_front_path: paths.front,
      photo_back_path: paths.back,
      photo_right_path: paths.right,
      photo_left_path: paths.left,
    });

    if (insertError) throw new Error(insertError.message);

    tempFile = path.join(os.tmpdir(), `aurafit-profile-${profileId}.${frontExt}`);
    const bytes = await (front as File).arrayBuffer();
    await writeFile(tempFile, Buffer.from(bytes));

    const model = process.env.PIXVERSE_VIDEO_MODEL ?? "v6";
    const quality = process.env.PIXVERSE_VIDEO_QUALITY ?? "720p";
    const aspectRatio = process.env.PIXVERSE_TRYON_ASPECT_RATIO ?? "9:16";

    const result = await runPixverseCreateVideo({
      prompt: buildProfilePrompt({ heightCm, ageYears, weightKg, size }),
      imagePath: tempFile,
      model,
      quality,
      aspectRatio,
    });

    const remoteVideoUrl =
      safeString((result as Record<string, unknown>).video_url) ??
      safeString((result as Record<string, unknown>).url) ??
      safeString((result as Record<string, unknown>).video);

    if (!remoteVideoUrl || !remoteVideoUrl.startsWith("http")) {
      throw new Error("PixVerse tidak mengembalikan video_url.");
    }

    const videoRes = await fetch(remoteVideoUrl);
    if (!videoRes.ok) throw new Error("Gagal download video dari PixVerse.");

    const videoBytes = await videoRes.arrayBuffer();
    const outPath = `tryon/profiles/${profileId}/pixverse-${Date.now()}.mp4`;
    const videoUpload = await bucket.upload(outPath, Buffer.from(videoBytes), {
      upsert: true,
      cacheControl: "31536000",
      contentType: "video/mp4",
    });
    if (videoUpload.error) throw new Error(videoUpload.error.message);

    const publicVideoUrl = bucket.getPublicUrl(outPath).data.publicUrl;

    return NextResponse.json({
      user_profile_id: profileId,
      photo_urls: urls,
      video_url: publicVideoUrl,
      recommended_size: size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal submit onboarding.";
    const status =
      message.startsWith("Missing") || message.startsWith("Invalid") ? 400 : 500;
    return NextResponse.json(
      { message },
      { status },
    );
  } finally {
    if (tempFile) {
      await unlink(tempFile).catch(() => null);
    }
  }
}

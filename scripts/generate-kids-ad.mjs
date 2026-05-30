import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function runPixverseCreateVideo({ prompt, duration, model, quality, aspectRatio }) {
  const args = [
    "create",
    "video",
    "--prompt",
    prompt,
    "--model",
    model,
    "--quality",
    quality,
    "--aspect-ratio",
    aspectRatio,
    "--duration",
    String(duration),
    "--json",
  ];

  return await new Promise((resolve, reject) => {
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
      if (err?.code === "ENOENT") {
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
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Output PixVerse tidak valid (bukan JSON)."));
      }
    });
  });
}

function pickUrl(result) {
  if (!result || typeof result !== "object") return null;
  const keys = ["video_url", "url", "video"];
  for (const key of keys) {
    const value = result[key];
    if (typeof value === "string" && value.startsWith("http")) return value;
  }
  return null;
}

const prompt = [
  "Professional fashion advertisement video, cinematic, premium ecommerce.",
  "Kids attire collection: vibrant happy colors, modern but fun silhouettes, playful patterns.",
  "Studio set with soft daylight, clean background, subtle motion, smooth camera pan, premium typography-free.",
  "No text, no watermark, no logo overlay.",
].join(" ");

const duration = Number(process.env.PIXVERSE_AD_DURATION ?? 6);
const model = process.env.PIXVERSE_AD_MODEL ?? "v6";
const quality = process.env.PIXVERSE_AD_QUALITY ?? "720p";
const aspectRatio = process.env.PIXVERSE_AD_ASPECT_RATIO ?? "21:9";

const result = await runPixverseCreateVideo({ prompt, duration, model, quality, aspectRatio });
const videoUrl = pickUrl(result);
if (!videoUrl) throw new Error("PixVerse tidak mengembalikan video_url.");

const res = await fetch(videoUrl);
if (!res.ok) throw new Error(`Gagal download video: ${res.status}`);
const bytes = await res.arrayBuffer();

const outDir = path.join(process.cwd(), "public", "assets", "pixverse-video");
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, "kids-ad.mp4");
await writeFile(outFile, Buffer.from(bytes));

process.stdout.write(`Saved: ${outFile}\n`);

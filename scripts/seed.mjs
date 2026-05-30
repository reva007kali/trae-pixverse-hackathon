import { createClient } from "@supabase/supabase-js";

function requiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
}

const supabaseServiceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const products = [
  {
    id: "2b08e0b9-9c1a-4c0d-8c38-41fe2a637c7f",
    name: "Urban Stealth Casual Jacket",
    brand: "Aura Atelier",
    price_cents: 18900,
    currency: "USD",
    tags: ["premium", "jacket", "stealth"],
    mannequin_media_urls: ["/products/jacket-mannequin-1.jpg"],
    description: "A minimal, engineered jacket with a sharp silhouette and quiet hardware.",
    fit_notes: "Regular fit. If between sizes, size up for layering.",
  },
  {
    id: "b5a3dbd0-f1b7-4b06-b688-5c6d93b0e8c0",
    name: "Emerald Line Knit Tee",
    brand: "Noir Circuit",
    price_cents: 7900,
    currency: "USD",
    tags: ["premium", "tee", "knit"],
    mannequin_media_urls: ["/products/tee-mannequin-1.jpg"],
    description: "Dense knit tee with a subtle emerald piping detail.",
    fit_notes: "Slightly cropped. True to size.",
  },
  {
    id: "f5e7a2a6-3f12-4ae9-bf4f-0d42b9a2f9a4",
    name: "Matte Black Tailored Pants",
    brand: "Aura Atelier",
    price_cents: 12900,
    currency: "USD",
    tags: ["premium", "pants", "tailored"],
    mannequin_media_urls: ["/products/pants-mannequin-1.jpg"],
    description: "Tailored trousers with a clean break and structured drape.",
    fit_notes: "Tapered fit. Consider hemming for a sharper silhouette.",
  },
];

const { error } = await supabase.from("products").upsert(products, { onConflict: "id" });

if (error) {
  throw new Error(error.message);
}

process.stdout.write(`Seed OK: ${products.length} products\n`);

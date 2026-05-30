import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

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

const categories = [
  {
    category: "sport",
    brands: ["Pulse Athletics", "Core Motion", "Vanta Run"],
    items: ["Performance Tee", "Training Shorts", "Flex Leggings", "Track Jacket", "Compression Top"],
    tags: ["sport", "active", "breathable"],
    priceRange: [4900, 11900],
  },
  {
    category: "casual",
    brands: ["Everyday Studio", "Softline", "Mono Street"],
    items: ["Relaxed Hoodie", "Casual Tee", "Weekend Pants", "Easy Shorts", "Overshirt"],
    tags: ["casual", "daily", "soft"],
    priceRange: [3900, 12900],
  },
  {
    category: "woman",
    brands: ["Aura Atelier", "Maison Lucent", "Silhouette Lab"],
    items: ["Drape Dress", "Sculpted Skirt", "Satin Blouse", "Wide Leg Pants", "Statement Coat"],
    tags: ["woman", "premium", "clean"],
    priceRange: [7900, 29900],
  },
  {
    category: "man",
    brands: ["Black Tie Works", "Classique", "Noir Circuit"],
    items: ["Tailored Blazer", "Oxford Shirt", "Wool Trousers", "Minimal Bomber", "Crew Knit"],
    tags: ["man", "premium", "clean"],
    priceRange: [7900, 29900],
  },
  {
    category: "kids",
    brands: ["Sunny Pop", "Mini Motion", "Play Atelier"],
    items: [
      "Colorblock Hoodie",
      "Rainbow Tee",
      "Cargo Joggers",
      "Lightweight Windbreaker",
      "Skater Shorts",
      "Graphic Sweatshirt",
    ],
    tags: ["kids", "vibrant", "fun"],
    priceRange: [2900, 9900],
    perCategory: 6,
  },
];

function pick(list, index) {
  return list[index % list.length];
}

function centsBetween([min, max], index) {
  const span = Math.max(1, max - min);
  const step = (index * 997) % span;
  return min + step;
}

const products = [];
const perCategoryDefault = 5;

for (const [cIndex, c] of categories.entries()) {
  const perCategory = c.perCategory ?? perCategoryDefault;
  for (let i = 0; i < perCategory; i += 1) {
    const brand = pick(c.brands, i + cIndex);
    const item = pick(c.items, i * 2 + cIndex);
    const namePrefix = pick(
      ["Aura", "Matte", "Sporty", "Lux", "Studio", "Stealth", "Clean", "Vibrant", "Happy", "Pop"],
      i + cIndex * 3,
    );

    products.push({
      category: c.category,
      name: `${namePrefix} ${item}`,
      brand,
      price_cents: centsBetween(c.priceRange, i + cIndex),
      currency: "USD",
      tags: Array.from(new Set(["premium", c.category, ...c.tags])),
      mannequin_media_urls: [],
      description: `Prototype item for ${c.category}. Placeholder description.`,
      fit_notes: "Prototype fit notes. True to size.",
    });
  }
}

const { error: clearError } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");

if (clearError) {
  throw new Error(clearError.message);
}

const { error } = await supabase.from("products").insert(products);

if (error) {
  throw new Error(error.message);
}

process.stdout.write(`Seed OK: ${products.length} products\n`);

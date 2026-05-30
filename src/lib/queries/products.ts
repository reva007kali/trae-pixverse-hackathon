import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types/db";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

export async function listProducts(
  client: SupabaseClient,
  options?: {
    limit?: number;
    query?: string;
    category?: string;
    brand?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
    sort?: ProductSort;
  },
): Promise<Product[]> {
  const limit = options?.limit ?? 24;
  const query = options?.query?.trim();
  const category = options?.category?.trim();
  const brand = options?.brand?.trim();
  const minPriceCents = options?.minPriceCents;
  const maxPriceCents = options?.maxPriceCents;
  const sort = options?.sort;

  let filtered = client.from("products").select("*");

  if (category) {
    filtered = filtered.eq("category", category);
  }

  if (brand) {
    filtered = filtered.ilike("brand", `%${brand}%`);
  }

  if (typeof minPriceCents === "number" && Number.isFinite(minPriceCents)) {
    filtered = filtered.gte("price_cents", Math.max(0, Math.round(minPriceCents)));
  }

  if (typeof maxPriceCents === "number" && Number.isFinite(maxPriceCents)) {
    filtered = filtered.lte("price_cents", Math.max(0, Math.round(maxPriceCents)));
  }

  if (query) {
    filtered = filtered.or(`name.ilike.%${query}%,brand.ilike.%${query}%`);
  }

  if (sort === "price_asc") {
    filtered = filtered.order("price_cents", { ascending: true });
  } else if (sort === "price_desc") {
    filtered = filtered.order("price_cents", { ascending: false });
  } else if (sort === "name_asc") {
    filtered = filtered.order("name", { ascending: true });
  } else if (sort === "name_desc") {
    filtered = filtered.order("name", { ascending: false });
  } else {
    filtered = filtered.order("created_at", { ascending: false });
  }

  const { data, error } = await filtered.limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as Product[];
}

export async function getProductById(
  client: SupabaseClient,
  id: string,
): Promise<Product | null> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Product | null) ?? null;
}

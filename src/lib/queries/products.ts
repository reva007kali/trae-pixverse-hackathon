import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types/db";

export async function listProducts(
  client: SupabaseClient,
  options?: { limit?: number },
): Promise<Product[]> {
  const limit = options?.limit ?? 24;

  const { data, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

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

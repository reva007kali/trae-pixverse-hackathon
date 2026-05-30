import type { SupabaseClient } from "@supabase/supabase-js";
import type { TryOnResult } from "@/lib/types/db";

export type CreateTryOnResultInput = {
  user_profile_id: string;
  product_id: string;
  result_type: "image" | "video";
  result_path: string;
};

export async function listTryOnResultsForUserId(
  client: SupabaseClient,
  userId: string,
  options?: { limit?: number },
): Promise<TryOnResult[]> {
  const limit = options?.limit ?? 24;

  const { data, error } = await client
    .from("tryon_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as TryOnResult[];
}

export async function createTryOnResult(
  client: SupabaseClient,
  input: CreateTryOnResultInput,
): Promise<TryOnResult> {
  const { data, error } = await client
    .from("tryon_results")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TryOnResult;
}

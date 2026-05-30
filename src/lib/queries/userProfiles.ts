import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/db";

export type CreateUserProfileInput = {
  height_cm: number;
  age_years: number;
  weight_kg: number;
  waist_cm?: number;
  photo_front_path: string;
  photo_back_path: string;
  photo_right_path: string;
  photo_left_path: string;
};

export async function getUserProfileForUserId(
  client: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserProfile | null) ?? null;
}

export async function createUserProfile(
  client: SupabaseClient,
  input: CreateUserProfileInput,
): Promise<UserProfile> {
  const { data, error } = await client
    .from("user_profiles")
    .insert({
      ...input,
      waist_cm: input.waist_cm ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfile;
}

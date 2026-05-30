import { createClient } from "@supabase/supabase-js";
import { getServiceSupabaseConfig } from "@/lib/env";

export function createSupabaseServiceClient() {
  const { url, serviceRoleKey } = getServiceSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

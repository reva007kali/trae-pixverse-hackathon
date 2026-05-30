export function normalizeProductImageUrl(input: string): string {
  const value = input.trim();
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return value;

  if (value.startsWith("/storage/v1/object/")) return `${supabaseUrl}${value}`;
  if (value.startsWith("storage/v1/object/")) return `${supabaseUrl}/${value}`;

  const cleaned = value.replace(/^\/+/, "").replace(/^product-images\//, "");
  return `${supabaseUrl}/storage/v1/object/public/product-images/${cleaned}`;
}

export function safeFirstProductImageUrl(urls: unknown): string | null {
  if (!Array.isArray(urls)) return null;
  const first = urls.find((value) => typeof value === "string" && value.trim().length > 0);
  if (typeof first !== "string") return null;
  return normalizeProductImageUrl(first);
}

export type Product = {
  id: string;
  category: string;
  name: string;
  brand: string;
  price_cents: number;
  currency: string;
  tags: unknown;
  mannequin_media_urls: unknown;
  description: string;
  fit_notes: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  user_id: string | null;
  height_cm: number;
  age_years: number;
  weight_kg: number;
  waist_cm: number | null;
  photo_front_path: string;
  photo_back_path: string;
  photo_right_path: string;
  photo_left_path: string;
  created_at: string;
  updated_at: string;
};

export type TryOnResult = {
  id: string;
  user_id: string | null;
  user_profile_id: string;
  product_id: string;
  result_type: "image" | "video";
  result_path: string;
  created_at: string;
};

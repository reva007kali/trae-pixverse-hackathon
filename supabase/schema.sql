create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  price_cents int not null,
  currency text not null default 'USD',
  tags jsonb not null default '[]'::jsonb,
  mannequin_media_urls jsonb not null default '[]'::jsonb,
  description text not null default '',
  fit_notes text not null default '',
  created_at timestamptz not null default now()
);

alter table products enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'Products are readable'
  ) then
    create policy "Products are readable" on products for select using (true);
  end if;
end $$;

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  height_cm int not null,
  age_years int not null,
  weight_kg numeric not null,
  waist_cm numeric,
  photo_front_path text not null,
  photo_back_path text not null,
  photo_right_path text not null,
  photo_left_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles select') then
    create policy "UserProfiles select" on user_profiles for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles insert') then
    create policy "UserProfiles insert" on user_profiles for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles update') then
    create policy "UserProfiles update" on user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles delete') then
    create policy "UserProfiles delete" on user_profiles for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on user_profiles;
create trigger user_profiles_set_updated_at
before update on user_profiles
for each row
execute function set_updated_at();

create table if not exists tryon_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  user_profile_id uuid not null references user_profiles(id),
  product_id uuid not null references products(id),
  result_type text not null check (result_type in ('image','video')),
  result_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists tryon_results_user_id_idx on tryon_results(user_id);
create index if not exists tryon_results_product_id_idx on tryon_results(product_id);

alter table tryon_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tryon_results' and policyname = 'TryOnResults select') then
    create policy "TryOnResults select" on tryon_results for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tryon_results' and policyname = 'TryOnResults insert') then
    create policy "TryOnResults insert" on tryon_results for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tryon_results' and policyname = 'TryOnResults delete') then
    create policy "TryOnResults delete" on tryon_results for delete using (auth.uid() = user_id);
  end if;
end $$;

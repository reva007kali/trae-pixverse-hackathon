create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'fashion',
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

alter table products add column if not exists category text not null default 'fashion';
create index if not exists products_category_idx on products(category);

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
  user_id uuid,
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

alter table user_profiles drop constraint if exists user_profiles_user_id_fkey;
alter table user_profiles alter column user_id drop not null;

alter table user_profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles select') then
    create policy "UserProfiles select" on user_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles insert') then
    create policy "UserProfiles insert" on user_profiles for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles update') then
    create policy "UserProfiles update" on user_profiles for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'UserProfiles delete') then
    create policy "UserProfiles delete" on user_profiles for delete using (true);
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
  user_id uuid,
  user_profile_id uuid not null references user_profiles(id),
  product_id uuid not null references products(id),
  result_type text not null check (result_type in ('image','video')),
  result_path text not null,
  created_at timestamptz not null default now()
);

alter table tryon_results drop constraint if exists tryon_results_user_id_fkey;
alter table tryon_results alter column user_id drop not null;

create index if not exists tryon_results_user_id_idx on tryon_results(user_id);
create index if not exists tryon_results_product_id_idx on tryon_results(product_id);

alter table tryon_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tryon_results' and policyname = 'TryOnResults select') then
    create policy "TryOnResults select" on tryon_results for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tryon_results' and policyname = 'TryOnResults insert') then
    create policy "TryOnResults insert" on tryon_results for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tryon_results' and policyname = 'TryOnResults delete') then
    create policy "TryOnResults delete" on tryon_results for delete using (true);
  end if;
end $$;

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_session_id_idx on cart_items(session_id);
create index if not exists cart_items_product_id_idx on cart_items(product_id);
create unique index if not exists cart_items_session_product_uniq on cart_items(session_id, product_id);

alter table cart_items enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cart_items' and policyname = 'CartItems all') then
    create policy "CartItems all" on cart_items for all using (true) with check (true);
  end if;
end $$;

drop trigger if exists cart_items_set_updated_at on cart_items;
create trigger cart_items_set_updated_at
before update on cart_items
for each row
execute function set_updated_at();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  email text not null,
  name text not null,
  status text not null check (status in ('paid')),
  currency text not null default 'USD',
  total_cents int not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_session_id_idx on orders(session_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null check (quantity > 0),
  unit_price_cents int not null,
  currency text not null default 'USD'
);

create index if not exists order_items_order_id_idx on order_items(order_id);

alter table orders enable row level security;
alter table order_items enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Orders all') then
    create policy "Orders all" on orders for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'OrderItems all') then
    create policy "OrderItems all" on order_items for all using (true) with check (true);
  end if;
end $$;

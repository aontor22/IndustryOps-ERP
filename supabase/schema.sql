-- IndustryOps ERP Lite Supabase schema
-- Run this once in Supabase SQL Editor.
-- Auth: enable Email OTP. For Phone OTP, configure an SMS provider in Supabase Auth settings.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  active_org_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_active_org_fk'
  ) then
    alter table public.profiles add constraint profiles_active_org_fk
    foreign key (active_org_id) references public.organizations(id) on delete set null;
  end if;
end $$;

create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = check_org_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(check_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = check_org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  );
$$;

create or replace function public.create_default_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations(name, owner_id)
  values (coalesce(nullif(org_name, ''), 'My Company'), auth.uid())
  returning id into new_org_id;

  insert into public.organization_members(org_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner')
  on conflict (org_id, user_id) do nothing;

  insert into public.profiles(id, full_name, active_org_id)
  values (auth.uid(), 'Business User', new_org_id)
  on conflict (id) do update set active_org_id = excluded.active_org_id, updated_at = now();

  return new_org_id;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sku text,
  name text not null,
  category text,
  unit text default 'pcs',
  cost_price numeric(12,2) default 0,
  selling_price numeric(12,2) default 0,
  stock_qty numeric(12,2) default 0,
  low_stock_qty numeric(12,2) default 5,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'completed' check (status in ('draft', 'completed', 'cancelled')),
  sold_at timestamptz default now(),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  quantity numeric(12,2) not null default 1,
  unit_cost numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'received' check (status in ('ordered', 'received', 'cancelled')),
  purchased_at timestamptz default now(),
  invoice_no text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text default 'General',
  amount numeric(12,2) not null default 0,
  payment_method text default 'Cash',
  expense_date timestamptz default now(),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_org_idx on public.products(org_id);
create index if not exists customers_org_idx on public.customers(org_id);
create index if not exists suppliers_org_idx on public.suppliers(org_id);
create index if not exists sales_org_idx on public.sales(org_id, sold_at desc);
create index if not exists purchases_org_idx on public.purchases(org_id, purchased_at desc);
create index if not exists expenses_org_idx on public.expenses(org_id, expense_date desc);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.purchases enable row level security;
alter table public.expenses enable row level security;

-- Drop old policies before re-running this file
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "organizations_select_member" on public.organizations;
drop policy if exists "organizations_insert_owner" on public.organizations;
drop policy if exists "organizations_update_admin" on public.organizations;
drop policy if exists "members_select_same_org" on public.organization_members;
drop policy if exists "members_insert_admin" on public.organization_members;
drop policy if exists "members_update_admin" on public.organization_members;
drop policy if exists "members_delete_owner" on public.organization_members;
drop policy if exists "products_all_member" on public.products;
drop policy if exists "customers_all_member" on public.customers;
drop policy if exists "suppliers_all_member" on public.suppliers;
drop policy if exists "sales_all_member" on public.sales;
drop policy if exists "purchases_all_member" on public.purchases;
drop policy if exists "expenses_all_member" on public.expenses;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Organizations and membership
create policy "organizations_select_member" on public.organizations for select using (public.is_org_member(id) or owner_id = auth.uid());
create policy "organizations_insert_owner" on public.organizations for insert with check (owner_id = auth.uid());
create policy "organizations_update_admin" on public.organizations for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "members_select_same_org" on public.organization_members for select using (public.is_org_member(org_id) or user_id = auth.uid());
create policy "members_insert_admin" on public.organization_members for insert with check (public.is_org_admin(org_id));
create policy "members_update_admin" on public.organization_members for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "members_delete_owner" on public.organization_members for delete using (public.is_org_admin(org_id));

-- Tenant tables
create policy "products_all_member" on public.products for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "customers_all_member" on public.customers for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "suppliers_all_member" on public.suppliers for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "sales_all_member" on public.sales for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "purchases_all_member" on public.purchases for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "expenses_all_member" on public.expenses for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

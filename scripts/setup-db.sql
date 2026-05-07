-- =============================================================
-- GoMiGooo! Database Schema
-- Run this in Supabase SQL Editor: supabase.com → SQL Editor
-- =============================================================

-- ================================================================
-- HELPER FUNCTION: auto-update updated_at timestamps
-- ================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ================================================================
-- TABLE: users
-- Mirrors Supabase auth.users — auto-created on signup
-- ================================================================
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  phone         text,
  name          text,
  avatar_url    text,
  role          text not null default 'customer'
                check (role in ('customer','hotel_owner','cab_owner','guide','shop_owner','admin')),
  kyc_verified  boolean not null default false,
  onboarding_done boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();

-- Auto-create user row when someone signs in via Google OAuth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- TABLE: platform_settings
-- All configuration editable from Admin Settings UI
-- ================================================================
create table if not exists public.platform_settings (
  key         text primary key,
  value       text,
  sensitive   boolean not null default false,
  category    text not null check (category in ('payments','email','ai','content','features','pricing')),
  label       text not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users(id)
);

create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: destinations
-- ================================================================
create table if not exists public.destinations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  state          text not null,
  description    text,
  cover_image    text,
  lat            double precision not null,
  lng            double precision not null,
  property_count int not null default 0,
  is_featured    boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ================================================================
-- TABLE: properties
-- ================================================================
create table if not exists public.properties (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.users(id) on delete cascade,
  type            text not null check (type in ('hotel','cottage','homestay','resort','camping')),
  title           text not null,
  description     text,
  ai_description  text,
  price_per_night numeric(10,2) not null check (price_per_night > 0),
  location        text not null,
  lat             double precision not null,
  lng             double precision not null,
  city            text not null,
  state           text not null,
  destination_id  uuid references public.destinations(id),
  amenities       text[] not null default '{}',
  max_guests      int not null default 2,
  bedrooms        int not null default 1,
  bathrooms       int not null default 1,
  rating          numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count    int not null default 0,
  view_count      int not null default 0,
  status          text not null default 'pending'
                  check (status in ('pending','active','suspended','deleted')),
  cover_image     text,
  phone           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_properties_location on public.properties using btree (lat, lng);
create index if not exists idx_properties_city on public.properties (lower(city));
create index if not exists idx_properties_status on public.properties (status);
create index if not exists idx_properties_owner on public.properties (owner_id);
create index if not exists idx_properties_destination on public.properties (destination_id);

create trigger properties_updated_at before update on public.properties
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: property_images
-- ================================================================
create table if not exists public.property_images (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url         text not null,
  is_official boolean not null default true,
  disputed    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_property_images_property on public.property_images (property_id, sort_order);

-- ================================================================
-- TABLE: bookings
-- ================================================================
create table if not exists public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  property_id           uuid not null references public.properties(id) on delete restrict,
  customer_id           uuid not null references public.users(id) on delete restrict,
  check_in              date not null,
  check_out             date not null,
  guests                int not null check (guests > 0),
  total_amount          numeric(10,2) not null check (total_amount > 0),
  advance_paid          numeric(10,2) not null default 0,
  balance_due           numeric(10,2) generated always as (total_amount - advance_paid) stored,
  nights                int generated always as (check_out - check_in) stored,
  payment_method        text check (payment_method in ('card','netbanking','upi','wallet')),
  status                text not null default 'pending'
                        check (status in ('pending','advance_paid','confirmed',
                                          'checked_in','completed','cancelled','refunded')),
  razorpay_order_id     text,
  razorpay_payment_id   text,
  razorpay_signature    text,
  special_requests      text,
  cancellation_reason   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint no_same_day check (check_out > check_in),
  constraint advance_le_total check (advance_paid <= total_amount)
);

create index if not exists idx_bookings_customer on public.bookings (customer_id);
create index if not exists idx_bookings_property on public.bookings (property_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_dates on public.bookings (check_in, check_out);

create trigger bookings_updated_at before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: reviews
-- Only guests with completed bookings can review
-- ================================================================
create table if not exists public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid unique not null references public.bookings(id) on delete cascade,
  property_id         uuid not null references public.properties(id) on delete cascade,
  reviewer_id         uuid not null references public.users(id) on delete cascade,
  overall_rating      int not null check (overall_rating between 1 and 5),
  cleanliness_rating  int check (cleanliness_rating between 1 and 5),
  accuracy_rating     int check (accuracy_rating between 1 and 5),
  location_rating     int check (location_rating between 1 and 5),
  value_rating        int check (value_rating between 1 and 5),
  comment             text,
  owner_reply         text,
  verified_stay       boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists idx_reviews_property on public.reviews (property_id);

-- Auto-update property rating when review added/updated
create or replace function public.update_property_rating()
returns trigger language plpgsql as $$
begin
  update public.properties
  set
    rating = (select avg(overall_rating)::numeric(3,2) from public.reviews where property_id = coalesce(new.property_id, old.property_id)),
    review_count = (select count(*) from public.reviews where property_id = coalesce(new.property_id, old.property_id))
  where id = coalesce(new.property_id, old.property_id);
  return new;
end;
$$;

create trigger reviews_update_rating after insert or update or delete on public.reviews
  for each row execute procedure public.update_property_rating();

-- ================================================================
-- TABLE: review_images
-- ================================================================
create table if not exists public.review_images (
  id        uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  url       text not null,
  created_at timestamptz not null default now()
);

-- ================================================================
-- TABLE: guides
-- ================================================================
create table if not exists public.guides (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid unique not null references public.users(id) on delete cascade,
  name         text not null,
  bio          text,
  phone        text,
  languages    text[] not null default '{}',
  specialties  text[] not null default '{}',
  price_per_day numeric(8,2),
  rating       numeric(3,2) not null default 0,
  review_count int not null default 0,
  verified     boolean not null default false,
  license_url  text,
  destination_id uuid references public.destinations(id),
  status       text not null default 'active' check (status in ('active','suspended')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger guides_updated_at before update on public.guides
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: cabs
-- ================================================================
create table if not exists public.cabs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid unique not null references public.users(id) on delete cascade,
  vehicle_type   text not null check (vehicle_type in ('suv','sedan','minivan','auto','bike')),
  vehicle_name   text not null,
  seats          int not null,
  ac             boolean not null default true,
  price_per_km   numeric(6,2),
  price_per_day  numeric(8,2),
  phone          text,
  rating         numeric(3,2) not null default 0,
  status         text not null default 'active' check (status in ('active','suspended')),
  lat            double precision,
  lng            double precision,
  city           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger cabs_updated_at before update on public.cabs
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: shops
-- ================================================================
create table if not exists public.shops (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.users(id) on delete cascade,
  name           text not null,
  type           text not null,
  description    text,
  location       text,
  lat            double precision,
  lng            double precision,
  city           text,
  phone          text,
  timings        text,
  special_offers text,
  cover_image    text,
  status         text not null default 'active' check (status in ('active','suspended')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger shops_updated_at before update on public.shops
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: subscriptions
-- ================================================================
create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid unique not null references public.users(id) on delete cascade,
  plan                      text not null check (plan in ('starter','pro','premium')),
  amount                    numeric(8,2) not null,
  status                    text not null check (status in ('active','past_due','cancelled','trial')),
  razorpay_subscription_id  text unique,
  current_period_end        timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- TABLE: favorites
-- ================================================================
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, property_id)
);

-- ================================================================
-- TABLE: messages
-- ================================================================
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  sender_id   uuid not null references public.users(id) on delete cascade,
  content     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_messages_booking on public.messages (booking_id, created_at);

-- ================================================================
-- TABLE: notifications
-- ================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      text not null,
  body       text not null,
  type       text not null check (type in ('booking','message','review','subscription','system')),
  read       boolean not null default false,
  link       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, read, created_at desc);

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

alter table public.users enable row level security;
alter table public.platform_settings enable row level security;
alter table public.destinations enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_images enable row level security;
alter table public.guides enable row level security;
alter table public.cabs enable row level security;
alter table public.shops enable row level security;
alter table public.subscriptions enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- USERS
create policy "Users read own row" on public.users for select using (auth.uid() = id);
create policy "Users update own row" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admin reads all users" on public.users for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admin updates all users" on public.users for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- PLATFORM SETTINGS
create policy "Anyone reads non-sensitive settings" on public.platform_settings
  for select using (sensitive = false);
create policy "Admin reads all settings" on public.platform_settings
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin writes settings" on public.platform_settings
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- DESTINATIONS
create policy "Anyone reads destinations" on public.destinations for select using (true);
create policy "Admin manages destinations" on public.destinations for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- PROPERTIES
create policy "Anyone reads active properties" on public.properties
  for select using (status = 'active');
create policy "Owners read own properties" on public.properties
  for select using (auth.uid() = owner_id);
create policy "Owners insert own properties" on public.properties
  for insert with check (auth.uid() = owner_id);
create policy "Owners update own properties" on public.properties
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Admin manages all properties" on public.properties
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- PROPERTY IMAGES
create policy "Anyone reads property images" on public.property_images for select using (true);
create policy "Owners manage own property images" on public.property_images
  for all using (
    exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
  );
create policy "Admin manages all images" on public.property_images
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- BOOKINGS
create policy "Customers see own bookings" on public.bookings
  for select using (auth.uid() = customer_id);
create policy "Owners see bookings for their properties" on public.bookings
  for select using (
    exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
  );
create policy "Customers create bookings" on public.bookings
  for insert with check (auth.uid() = customer_id);
create policy "Customers cancel pending bookings" on public.bookings
  for update using (auth.uid() = customer_id and status in ('pending','advance_paid'))
  with check (status = 'cancelled');
create policy "Owners manage booking status" on public.bookings
  for update using (
    exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
  );
create policy "Admin manages all bookings" on public.bookings
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- REVIEWS
create policy "Anyone reads reviews" on public.reviews for select using (true);
create policy "Verified bookers insert reviews" on public.reviews
  for insert with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from public.bookings
      where id = booking_id and customer_id = auth.uid() and status = 'completed'
    )
  );
create policy "Reviewers update own reviews" on public.reviews
  for update using (auth.uid() = reviewer_id);
create policy "Owners reply to their property reviews" on public.reviews
  for update using (
    exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
  );

-- REVIEW IMAGES
create policy "Anyone reads review images" on public.review_images for select using (true);
create policy "Reviewers manage own review images" on public.review_images
  for all using (
    exists (select 1 from public.reviews where id = review_id and reviewer_id = auth.uid())
  );

-- GUIDES
create policy "Anyone reads active guides" on public.guides
  for select using (status = 'active');
create policy "Guides manage own profile" on public.guides
  for all using (auth.uid() = owner_id);
create policy "Admin manages guides" on public.guides
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- CABS
create policy "Anyone reads active cabs" on public.cabs
  for select using (status = 'active');
create policy "Cab owners manage own" on public.cabs
  for all using (auth.uid() = owner_id);
create policy "Admin manages cabs" on public.cabs
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- SHOPS
create policy "Anyone reads active shops" on public.shops
  for select using (status = 'active');
create policy "Shop owners manage own" on public.shops
  for all using (auth.uid() = owner_id);
create policy "Admin manages shops" on public.shops
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- SUBSCRIPTIONS
create policy "Owners see own subscription" on public.subscriptions
  for select using (auth.uid() = owner_id);
create policy "Owners manage own subscription" on public.subscriptions
  for all using (auth.uid() = owner_id);
create policy "Admin manages all subscriptions" on public.subscriptions
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- FAVORITES
create policy "Users manage own favorites" on public.favorites
  for all using (auth.uid() = user_id);

-- MESSAGES
create policy "Booking participants read messages" on public.messages
  for select using (
    auth.uid() = sender_id or
    exists (select 1 from public.bookings where id = booking_id and customer_id = auth.uid()) or
    exists (
      select 1 from public.bookings b
      join public.properties p on b.property_id = p.id
      where b.id = booking_id and p.owner_id = auth.uid()
    )
  );
create policy "Booking participants send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and (
      exists (select 1 from public.bookings where id = booking_id and customer_id = auth.uid()) or
      exists (
        select 1 from public.bookings b
        join public.properties p on b.property_id = p.id
        where b.id = booking_id and p.owner_id = auth.uid()
      )
    )
  );

-- NOTIFICATIONS
create policy "Users manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- ================================================================
-- STORAGE BUCKETS
-- Run in Supabase Dashboard → Storage → Create Bucket (or use below)
-- ================================================================
-- These need to be created in the Supabase Dashboard → Storage tab:
-- 1. property-images (public bucket)
-- 2. profile-photos (public bucket)
-- 3. review-photos (public bucket)
-- 4. kyc-documents (private bucket)

# GoMiGooo!

> **Discover India. Directly.** — A zero-commission tourism marketplace, starting with The Nilgiris.

GoMiGooo! is a complete production-ready SaaS for owners of homestays, cottages, hotels, cabs, and guides in India. Owners pay a flat monthly subscription (₹299 / ₹599 / ₹999) — travelers pay zero booking fees.

## Tech Stack (all free tiers)

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| DB / Auth / Storage | Supabase (PostgreSQL, Google OAuth, RLS) |
| Maps | Leaflet + OpenStreetMap (no API key) |
| Payments | Razorpay (cards + UPI + subscriptions) |
| AI | Claude Haiku (descriptions + trip planner) |
| Email | Resend |
| Hosting | Vercel + GitHub Actions |

## Built-in features

- **Landing page** with animated stats, destination carousel, and pricing
- **Google sign-in** + role-based onboarding (customer / hotel / cab / guide / shop)
- **Explore** with Leaflet map, distance/price/rating filters
- **Listing detail** with photo gallery, booking widget, Razorpay UPI flow, reviews
- **Owner dashboards**: listings, bookings, AI descriptions, photo upload, subscription
- **Customer dashboards**: trips, favorites, profile
- **Admin panel**: users, subscriptions, photo moderation, KYC, **6-tab Settings UI**
- **AI trip planner** (streaming, Claude Haiku) and listing description generator
- **PWA manifest** — installable on mobile

## Setup

### 1. Clone & install

```bash
git clone https://github.com/tejvinapp/GoMigo_New.git
cd GoMigo_New
npm install --legacy-peer-deps
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) -> New project
2. SQL Editor -> run `scripts/setup-db.sql`
3. SQL Editor -> run `scripts/seed-data.sql`
4. Auth -> Providers -> enable Google (add redirect: `<your-domain>/auth/callback`)
5. Storage -> create buckets: `property-images`, `profile-photos`, `review-photos`, `kyc-documents`

### 3. Env vars

Copy `.env.example` -> `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**That's it.** Everything else (Razorpay keys, Resend API key, Anthropic API key, hero copy, pricing) is configured **inside the app** at `/admin/settings`.

### 4. Run

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
```

### 5. Deploy

Push to `main` -> Vercel auto-deploys via GitHub integration. Set the 3 Supabase env vars in Vercel project settings.

## Admin setup (after deploy)

1. Sign in via Google
2. In Supabase SQL Editor, set your role to admin: `update users set role = 'admin' where email = 'you@example.com';`
3. Open `/admin/settings` and configure:
   - **Payments**: Razorpay Key ID, Secret, Webhook Secret, UPI VPA
   - **Email**: Resend API key, From email
   - **AI**: Anthropic API key + feature toggles
   - **Content**: hero headline, stats, testimonials
   - **Pricing**: Starter / Pro / Premium plan amounts
   - **Features**: AI descriptions, photo moderation, etc.

## Project structure

```
app/
  landing/                # Marketing page
  auth/ + onboarding/     # Google OAuth + role selection
  explore/[id]/           # Listings + detail
  customer/               # Customer dashboard, bookings, profile
  owner/                  # Owner dashboard + listing CRUD
  admin/                  # Admin (users, KYC, photos, subs, settings)
  api/
    payments/             # Razorpay create/verify/webhook
    ai/                   # Trip planner + AI description
    email/                # Resend test + booking email
    bookings/             # Booking creation
components/
  cards/                  # ListingCard, DestinationCard
  maps/                   # LeafletMap (dynamic, no SSR)
  ui/                     # shadcn primitives + Price, Rating, Status
lib/
  supabase/               # client + server + middleware helpers
  utils/                  # geo (haversine + Nominatim + Overpass)
  validations/            # Zod schemas
scripts/
  setup-db.sql            # 14 tables, triggers, RLS
  seed-data.sql           # 5 destinations + initial settings
```

## License

Proprietary - (c) GoMiGooo!

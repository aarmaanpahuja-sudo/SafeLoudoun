# SafeLoudoun

A real-time neighborhood safety platform where neighbors report and track local incidents — open garage doors, unattended packages, lost pets, vandalism, suspicious activity, and safe-walk requests. Built for communities to stay informed and look out for each other.

Website: https://safeloudoun.vercel.app

## Features

- **Live incident feed** — Browse active, resolved, or all alerts filtered by your watch zones
- **Interactive live map** — Real-time map of active incidents with category-colored pins, coordinates on click, and one-tap resolve
- **File a report** — Two-steps: pick a category, add details, capture GPS location (optional), and post to your zip code community
- **Watch zones** — Monitor any US zip code. Filter the feed and map to only show what matters to you
- **Neighbor karma** — Earn +10 karma for every report you file. Your score is saved with your account
- **Community verification** — Neighbors can verify reports and mark them as resolved
- **Comments & updates** — Threaded updates on each incident to coordinate with neighbors
- **Analytics dashboard** — Breakdown of reports by category and zip code
- **Real-time sync** — New reports, comments, and status changes appear instantly across all devices via Supabase Realtime
- **Optional accounts** — Use the app anonymously (browser-based) or sign up with email/password to save your profile across devices

## Incident Categories

| Category | Description |
|----------|-------------|
| Open Garage Door | Garage left open, possible security concern |
| Unattended Package | Delivery left out, at risk of theft |
| Lost / Found Pet | Missing or found animals in the area |
| Property Vandalism | Damage to property, graffiti, break-ins |
| Suspicious Activity | Unusual or concerning behavior |
| Safe Walk Request | Request a walking companion for safety |

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Maps:** Leaflet Open Street Map (OSM) Data
- **Backend:** Supabase (Postgres + Realtime + Auth)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or run the included migrations against your own)

### Install

```bash
npm install
```

### Configure

Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run the dev server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Database

The schema and RLS policies are defined in `supabase/migrations/`. The app uses two identity paths:

- **Anonymous mode** — A browser-generated `client_id` (UUID) keys the user's profile, zones, and reports
- **Authenticated mode** — Email/password sign-up creates a `profiles` row keyed by `user_id` (Supabase Auth)

Both paths coexist via dual-path Row Level Security policies that check either `auth.uid() = user_id` or `client_id` match.

### Key tables

- `incidents` — Reports filed by neighbors (category, title, description, location, zip, status, verifications)
- `comments` — Threaded updates on incidents
- `watch_zones` — Zip codes a user monitors
- `profiles` — Display name and karma score

## Project Structure

```
src/
├── components/
│   ├── AuthModal.tsx        # Sign in / sign up modal
│   ├── IncidentCard.tsx     # Feed card with comments + inline mini-map
│   ├── MapView.tsx          # Full-screen live incident map
│   ├── MiniMap.tsx          # Inline map for incident detail
│   ├── ReportModal.tsx      # Two-step report filing flow
│   └── ...
├── lib/
│   ├── categories.ts        # Category metadata (icons, colors, labels)
│   ├── clientId.ts          # Anonymous browser identity
│   ├── geo.ts               # Zip code geocoding + map utilities
│   ├── supabase.ts          # Client + types
│   ├── useAuth.ts           # Auth hook (sign in/up/out, session)
│   └── useWatchTowerData.ts # Data hook (incidents, comments, zones, profile; WatchTower was the old name)
└── App.tsx                  # Main app shell with nav + views
```



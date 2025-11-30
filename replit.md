# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI is a Next.js 14 SaaS dashboard for tracking the Kimchi Premium (the price difference between Korean and global cryptocurrency exchanges). It provides real-time data, AI-powered analysis, trading signals, and arbitrage opportunities.

## Project Structure
```
├── src/
│   ├── lib/
│   │   ├── supabaseClient.ts  # Supabase client configuration
│   │   └── profile.ts         # User profile helper (ensureUserProfile)
│   ├── hooks/
│   │   └── useMarkets.ts      # Shared hook for market data fetching
│   ├── components/
│   │   ├── Layout.tsx         # Shared layout with navigation and footer
│   │   ├── HeroSection.tsx    # Homepage hero section (Korean)
│   │   ├── AIInsightBox.tsx   # AI summary box with mock data
│   │   ├── MarketTable.tsx    # Premium table component (uses useMarkets)
│   │   └── AlertCTA.tsx       # Alert feature CTA section
│   ├── pages/
│   │   ├── api/               # API routes
│   │   │   ├── hello.ts       # Health check endpoint
│   │   │   ├── prices.ts      # Crypto prices API
│   │   │   ├── alerts.ts      # User alerts API
│   │   │   ├── premium/
│   │   │   │   └── table.ts   # Premium table data API
│   │   │   └── ai/
│   │   │       └── daily.ts   # AI daily analysis API
│   │   ├── admin/
│   │   │   ├── index.tsx      # Admin dashboard
│   │   │   └── login.tsx      # Admin login page
│   │   ├── patterns/
│   │   │   └── [patternId].tsx # Pattern detail dynamic page
│   │   ├── fonts/             # Local font files
│   │   ├── _app.tsx           # App wrapper
│   │   ├── _document.tsx      # Document customization
│   │   ├── index.tsx          # Homepage (redesigned with components)
│   │   ├── markets.tsx        # Crypto premium table (uses useMarkets)
│   │   ├── analysis.tsx       # AI analysis page (protected)
│   │   ├── alerts.tsx         # User alerts with Supabase CRUD (protected)
│   │   ├── pricing.tsx        # Free vs Pro pricing
│   │   ├── login.tsx          # User login with Supabase auth
│   │   ├── signup.tsx         # User signup with profile sync
│   │   └── dashboard.tsx      # Pro user dashboard (protected)
│   └── styles/
│       └── globals.css        # Global styles with Tailwind
├── public/                    # Static assets
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── .eslintrc.json             # ESLint configuration
└── package.json               # Dependencies and scripts
```

## Tech Stack
- **Framework**: Next.js 14 with Pages Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Linting**: ESLint with Next.js config
- **Font**: Geist (local)

## Environment Variables (Secrets)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SESSION_SECRET` - Session secret for security

## Supabase Database Tables
- `public.users` - User profiles (id, email, plan, created_at)
- `public.price_snapshots` - Historical price data
- `public.alerts` - User alerts (id, user_id, symbol, condition_type, threshold, is_active, created_at)
- `public.ai_reports` - AI analysis reports (with seo_title, seo_description)
- `public.banners` - Marketing banners (with seo_title, seo_description)

## Shared Hooks
| Hook | Description |
|------|-------------|
| `useMarkets(limit?)` | Fetches market data from /api/premium/table, returns data, loading, error, fxRate, averagePremium, refetch |

## Homepage Components
| Component | Description |
|-----------|-------------|
| `HeroSection` | Main headline with Korean text and CTA button |
| `AIInsightBox` | AI summary box showing avg/max/min premium and analysis (mock) |
| `MarketTable` | Premium table with configurable limit, uses useMarkets hook |
| `AlertCTA` | Call-to-action section for alert feature |

## Pages
| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Landing page with Hero, AI Insight, Market Table, Alert CTA | No |
| `/markets` | Real-time Kimchi Premium table with auto-refresh | No |
| `/analysis` | AI-powered market analysis | Yes |
| `/alerts` | Create and manage price alerts (Supabase CRUD) | Yes |
| `/pricing` | Free vs Pro plan comparison | No |
| `/login` | User login form | No |
| `/signup` | User registration form | No |
| `/dashboard` | Pro user dashboard | Yes |
| `/admin` | Admin dashboard index | No |
| `/admin/login` | Admin login page | No |
| `/patterns/[patternId]` | Pattern detail page | No |

## API Routes
| Endpoint | Description |
|----------|-------------|
| `GET /api/hello` | Health check endpoint |
| `GET /api/prices` | Current crypto prices from Korean/global exchanges |
| `GET /api/premium/table` | Full premium table with all trading pairs |
| `GET /api/alerts` | User alerts list |
| `GET /api/ai/daily` | AI daily market analysis |

## Commands
- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development Notes
- Server binds to 0.0.0.0:5000 for Replit compatibility
- Cache-Control headers disabled for development
- Dark theme with gradient styling
- Mobile-first responsive design
- Protected pages use client-side auth guards with Supabase
- Homepage uses Korean language content

## Phase 1 Complete
- [x] Routing & pages setup
- [x] Shared layout with navigation
- [x] Footer with Data Sources and AI Methodology
- [x] Mock API routes

## Phase 2 Complete
- [x] Supabase client setup (src/lib/supabaseClient.ts)
- [x] Email/password signup with supabase.auth.signUp
- [x] Email/password login with supabase.auth.signInWithPassword
- [x] Logout button on dashboard with supabase.auth.signOut
- [x] Auth guards on protected pages (dashboard, analysis, alerts)
- [x] Dashboard displays user email from session

## Phase 2.5 Complete
- [x] Profile helper function (src/lib/profile.ts)
- [x] ensureUserProfile upserts to public.users on signup
- [x] Default plan set to 'free'

## Phase 3 Complete
- [x] Alerts CRUD connected to Supabase
- [x] Fetch alerts for current user only
- [x] Create new alerts with symbol, condition_type, threshold
- [x] Toggle is_active status
- [x] Delete alerts
- [x] All operations filtered by user_id for security

## Homepage Redesign Complete
- [x] New index.tsx with component-based structure
- [x] HeroSection component (Korean headline + CTA)
- [x] AIInsightBox component (uses useMarkets hook for real data)
- [x] MarketTable component (uses useMarkets hook)
- [x] AlertCTA component (alert feature promotion)
- [x] All internal links use next/link
- [x] Korean language content throughout

## MarketTable Data Integration Complete
- [x] Created src/hooks/useMarkets.ts for shared data fetching
- [x] MarketTable now fetches from /api/premium/table
- [x] Markets page uses same useMarkets hook
- [x] Auto-refresh every 30 seconds on Markets page
- [x] Shows loading and error states
- [x] Both pages share consistent data source

## AIInsightBox Data Integration Complete
- [x] AIInsightBox uses useMarkets hook for real data
- [x] Shows averagePremium from API
- [x] Calculates max/min premium from data array
- [x] Displays fxRate and updatedAt timestamp
- [x] Generates dynamic AI comment based on data

## Recent Changes
- AIInsightBox data integration complete (2024-11-30)
- AIInsightBox now shows real data: avg premium, max/min, fx rate, timestamp
- Dynamic AI comment generated based on market data

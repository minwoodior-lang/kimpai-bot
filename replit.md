# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI is a Next.js 14 SaaS dashboard for tracking the Kimchi Premium (the price difference between Korean and global cryptocurrency exchanges). It provides real-time data, AI-powered analysis, trading signals, and arbitrage opportunities.

## Project Structure
```
├── src/
│   ├── lib/
│   │   └── supabaseClient.ts  # Supabase client configuration
│   ├── components/
│   │   └── Layout.tsx         # Shared layout with navigation and footer
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
│   │   ├── index.tsx          # Homepage
│   │   ├── markets.tsx        # Crypto premium table
│   │   ├── analysis.tsx       # AI analysis page (protected)
│   │   ├── alerts.tsx         # User alerts page (protected)
│   │   ├── pricing.tsx        # Free vs Pro pricing
│   │   ├── login.tsx          # User login with Supabase auth
│   │   ├── signup.tsx         # User signup with Supabase auth
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
- `public.alerts` - User alerts (with user_id → auth.users.id)
- `public.ai_reports` - AI analysis reports (with seo_title, seo_description)
- `public.banners` - Marketing banners (with seo_title, seo_description)

## Pages
| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Landing page with features and premium stats | No |
| `/markets` | Real-time Kimchi Premium table | No |
| `/analysis` | AI-powered market analysis | Yes |
| `/alerts` | Create and manage price alerts | Yes |
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

## Recent Changes
- Phase 2 implementation complete (2024-11-29)
- Added Supabase client configuration
- Implemented email/password authentication on login/signup
- Added client-side auth guards to protected pages
- Dashboard now shows logged-in user email and logout button

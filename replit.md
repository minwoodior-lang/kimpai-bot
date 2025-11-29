# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI is a Next.js 14 SaaS dashboard for tracking the Kimchi Premium (the price difference between Korean and global cryptocurrency exchanges). It provides real-time data, AI-powered analysis, trading signals, and arbitrage opportunities.

## Project Structure
```
├── src/
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
│   │   ├── analysis.tsx       # AI analysis page
│   │   ├── alerts.tsx         # User alerts page
│   │   ├── pricing.tsx        # Free vs Pro pricing
│   │   ├── login.tsx          # User login page
│   │   ├── signup.tsx         # User signup page
│   │   └── dashboard.tsx      # Pro user dashboard
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
- **Linting**: ESLint with Next.js config
- **Font**: Geist (local)

## Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with features and premium stats |
| `/markets` | Real-time Kimchi Premium table |
| `/analysis` | AI-powered market analysis |
| `/alerts` | Create and manage price alerts |
| `/pricing` | Free vs Pro plan comparison |
| `/login` | User login form |
| `/signup` | User registration form |
| `/dashboard` | Pro user dashboard |
| `/admin` | Admin dashboard index |
| `/admin/login` | Admin login page |
| `/patterns/[patternId]` | Pattern detail page |

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
- All API routes currently return mock data (Phase 1)

## Phase 1 Complete
- [x] Routing & pages setup
- [x] Shared layout with navigation
- [x] Footer with Data Sources and AI Methodology
- [x] Mock API routes
- [ ] Phase 2: Real API integrations, Supabase, Stripe

## Recent Changes
- Phase 1 implementation complete
- All page routes created with placeholder content
- Layout component with responsive navigation
- Footer with Data Sources and AI Methodology sections
- Mock API routes for prices, premium, alerts, and AI analysis

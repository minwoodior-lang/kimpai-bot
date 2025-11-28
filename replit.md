# KimpAI - Next.js 14 SaaS Dashboard

## Overview
KimpAI is a clean Next.js 14 project configured for building a SaaS dashboard with TypeScript, Tailwind CSS, ESLint, and the pages directory structure.

## Project Structure
```
├── src/
│   ├── pages/           # Next.js pages (pages router)
│   │   ├── api/         # API routes
│   │   │   └── hello.ts # Health check API endpoint
│   │   ├── fonts/       # Local font files
│   │   ├── _app.tsx     # App wrapper
│   │   ├── _document.tsx # Document customization
│   │   └── index.tsx    # Homepage
│   └── styles/
│       └── globals.css  # Global styles with Tailwind
├── public/              # Static assets
├── next.config.mjs      # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
└── package.json         # Dependencies and scripts
```

## Tech Stack
- **Framework**: Next.js 14 with Pages Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint with Next.js config
- **Font**: Geist (local)

## Commands
- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Routes
- `GET /api/hello` - Health check endpoint returning status and timestamp

## Development Notes
- Server binds to 0.0.0.0:5000 for Replit compatibility
- Cache-Control headers disabled for development
- Dark theme with gradient styling ready for SaaS dashboard

## Recent Changes
- Initial project setup with Next.js 14
- Professional SaaS homepage with responsive design
- API route configured with health check endpoint

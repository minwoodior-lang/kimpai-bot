# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI is a Next.js 14 SaaS dashboard designed to track and analyze the "Kimchi Premium," the price disparity between cryptocurrency exchanges in South Korea and global markets. It offers real-time data, AI-driven insights, trading signals, and tools to identify arbitrage opportunities. The project aims to provide a comprehensive platform for users interested in this specific crypto market phenomenon.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application is built with Next.js 14 using the Pages Router, TypeScript, and Tailwind CSS for styling. Supabase is used for authentication and as the primary PostgreSQL database. The UI/UX features a dark theme with gradient styling and a mobile-first responsive design. Key features include real-time market data display, AI-powered analysis, user-managed price alerts, and a pro-user dashboard. Data fetching is centralized via shared hooks (`useMarkets`). The system dynamically calculates the Kimchi Premium using data from multiple domestic (Upbit, Bithumb, Coinone) and foreign (Binance, OKX, Bybit, etc.) exchanges. A continuous price worker script updates price data every 5 seconds, ensuring real-time accuracy and performing 24-hour data cleanup.

### Technical Implementations
- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **State Management**: `ExchangeSelectionContext` for global exchange selection.
- **Data Fetching**: `useMarkets` hook for market data, API routes for premium, prices, alerts, and AI analysis.
- **Real-time Updates**: Dedicated price worker (`priceWorker.ts`) updates data every 5 seconds.
- **UI Components**: Reusable components like `MarketTable`, `AIInsightBox`, `TradingViewChart`, `PremiumHistoryChart`, and `PremiumTicker`.

### Feature Specifications
- **Kimchi Premium Tracking**: Real-time display of premium across various crypto pairs and exchanges.
- **AI-powered Analysis**: Daily AI reports providing market insights.
- **User Alerts**: CRUD operations for managing price alerts with user-specific filtering.
- **Multi-Exchange Data**: Supports 10+ domestic and foreign exchanges for comprehensive data.
- **Interactive Charts**: TradingView charts and custom SVG premium history charts with dynamic symbol and exchange selection.
- **User Authentication**: Secure signup and login with Supabase, protecting pro-user features.
- **Admin Interface**: Dedicated admin dashboard for management.

### System Design Choices
- **Client-side Auth Guards**: Implemented for protected pages using Supabase.
- **Dynamic Content**: Homepage and MarketTable components are dynamically populated with real-time data.
- **Modular Components**: Emphasis on reusable and composable components for UI consistency.
- **API-driven**: All data interactions are handled via Next.js API routes.
- **Graceful Shutdown**: SIGTERM/SIGINT handlers for robust operation of worker scripts.

## External Dependencies
- **Supabase**: Database (PostgreSQL) and Authentication.
- **Upbit API**: Korean exchange prices.
- **CoinGecko API**: Global cryptocurrency prices (used as a fallback for Binance).
- **Exchange Rate API**: USD/KRW exchange rates.
- **TradingView**: Charting library for market visualization.
- **ESLint**: Code linting.
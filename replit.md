# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI is a Next.js 14 SaaS dashboard designed to track and analyze the "Kimchi Premium," the price disparity between cryptocurrency exchanges in South Korea and global markets. It offers real-time data, AI-driven insights, trading signals, and tools to identify arbitrage opportunities. The project aims to provide a comprehensive platform for users interested in this specific crypto market phenomenon.

## User Preferences
- I prefer detailed explanations.
- I want iterative development.
- Ask before making major changes.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.
- **NEVER use Autonomous mode** - only Fast mode allowed for single-file/single-feature work
- Ask permission before complex multi-file tasks

## System Architecture
The application is built with Next.js 14 using the Pages Router, TypeScript, and Tailwind CSS for styling. Supabase is used for authentication and as the primary PostgreSQL database. The UI/UX features a dark theme with gradient styling and a mobile-first responsive design. Key features include real-time market data display, AI-powered analysis, user-managed price alerts, and a pro-user dashboard. Data fetching is centralized via shared hooks (`useMarkets`). The system dynamically calculates the Kimchi Premium using data from multiple domestic (Upbit, Bithumb, Coinone) and foreign (Binance, OKX, Bybit, etc.) exchanges. A continuous price worker script updates price data every 5 seconds, ensuring real-time accuracy and performing 24-hour data cleanup.

### Technical Implementations
- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL) + Master Symbols Architecture
- **State Management**: `ExchangeSelectionContext` for global exchange selection.
- **Data Fetching**: `useMarkets` hook for market data, API routes for premium, prices, alerts, and AI analysis.
- **Real-time Updates**: Dedicated price worker (`priceWorker.ts`) updates data every 5 seconds.
- **UI Components**: Reusable components like `MarketTable`, `AIInsightBox`, `TradingViewChart`, `PremiumHistoryChart`, and `PremiumTicker`.
- **Master Symbol Architecture** (v3.0.6):
  - `master_symbols` table: Centralized symbol management (base_symbol, ko_name, coingecko_id, icon_url)
  - `exchange_symbol_mappings` table: Maps exchange-specific symbols to base_symbol
  - All pages display "한글명 / 영문심볼" format (e.g., "비트코인 / BTC")
  - Unified display across all exchanges (Upbit/Bithumb/Coinone show identical formatting)

### Feature Specifications
- **Kimchi Premium Tracking**: Real-time display of premium across various crypto pairs and exchanges.
- **AI-powered Analysis**: Daily AI reports providing market insights with PRO tier for advanced predictions.
- **User Alerts**: CRUD operations for managing price alerts with user-specific filtering.
- **Multi-Exchange Data**: Supports 10+ domestic and foreign exchanges for comprehensive data.
- **Interactive Charts**: TradingView charts with 12 preset views organized in 3 groups:
  - BTC / 프리미엄 지표 (7종): BTC Binance, BTC 김치프리미엄 Upbit/Bithumb, Coinbase Premium, Longs, Shorts, Dominance
  - 시장 전체 지표 (3종): TOTAL, TOTAL2 (Ex-BTC), TOTAL3 (Ex-BTC & ETH)
  - 추가 분석 지표 (2종): ALT Dominance, Korea Premium Index
- **Timeframe Selector**: 13 intervals from 1분 to 1월 (1m/3m/5m/15m/30m/45m/1H/2H/3H/4H/1D/1W/1M)
- **Advanced Search**: Korean initial consonant (초성) search support (e.g., ㅂㅋ → 비트코인).
- **Comparison Metrics**: 전일대비, 고가대비, 저가대비 columns with % and KRW values.
- **Localized Volume Formatting**: KRW (만/억/조) and USD (K/M/B) with proper currency prefixes.
- **CoinMarketCap Integration**: Direct links on coin names for external reference.
- **2-Second Data Refresh**: Real-time feel with rapid data updates (무료/유료 동일).
- **PRO Tier Features**: 48시간 김프 예측, 상세 분석 (마스킹 + 잠금 처리).
- **Rate Limiting**: Token bucket rate limiting (burst 10 requests, refill 2 per 2 seconds).
- **User Authentication**: Secure signup and login with Supabase, protecting pro-user features.
- **Admin Interface**: Dedicated admin dashboard for management.
- **Master Symbol Display** (v3.0.6): All exchanges (Upbit/Bithumb/Coinone/Binance/OKX/etc.) display "한글명 / 영문" format consistently

### Recent Changes (2025-12-02)
- **v3.0.6 Master Symbol Architecture 구현**:
  - `master_symbols` 테이블 생성: 중앙집중식 심볼 관리 (base_symbol PK, ko_name, coingecko_id, icon_url)
  - `exchange_symbol_mappings` 테이블: 거래소별 원본 심볼을 base_symbol과 연결
  - `/api/premium/table.ts` 수정: master_symbols 우선 조회 (Upbit API 폴백)
  - PremiumTable/markets: "한글명 / 영문심볼" 형식 통일 표시
  - 모든 거래소에서 동일한 한글명 표시 (빗썸/코인원도 한글 표기 정상화)
  - 글로벌 에러 핸들러 강화: null/undefined 에러도 안전 처리
  - `scripts/initializeMasterSymbols.ts`: 마스터 심볼 초기화 스크립트 (코인 메타데이터 동기화)
- **v3.0.5 CoinIcon normalizeSymbol 버그 수정 및 코인 매핑 확장** (이전)
- **v3.0.4 CoinIcon 컴포넌트 개선 - 200+ 코인 아이콘 지원** (이전)
- **v3.0.3 거래소 로고 개선 및 드롭다운 UX 향상** (이전)

### System Design Choices
- **Client-side Auth Guards**: Implemented for protected pages using Supabase.
- **Dynamic Content**: Homepage and MarketTable components are dynamically populated with real-time data.
- **Modular Components**: Emphasis on reusable and composable components for UI consistency.
- **API-driven**: All data interactions are handled via Next.js API routes.
- **Graceful Shutdown**: SIGTERM/SIGINT handlers for robust operation of worker scripts.
- **Master Symbol Pattern**: Centralized symbol management prevents inconsistent displays across exchanges
- **Bilingual Display Strategy** (v3.0.6+):
  - `fetchCoinMetadata()` loads master_symbols (priority) + Upbit API market/all (fallback)
  - Upbit-listed coins: "한글명 / English" (both from master_symbols or Upbit API)
  - Bithumb/Coinone-only coins: "English / English" (not in master_symbols or Upbit)
  - **Coverage Expansion**: When "English/English" coins are found, manually add to master_symbols (base_symbol, ko_name, coinmarketcap_slug, is_active=true) to populate Korean names incrementally

## External Dependencies
- **Supabase**: Database (PostgreSQL) and Authentication.
- **Upbit API**: Korean exchange prices.
- **CoinGecko API**: Global cryptocurrency prices (used as a fallback for Binance).
- **Exchange Rate API**: USD/KRW exchange rates.
- **TradingView**: Charting library for market visualization.
- **ESLint**: Code linting.

## Database Schema (Master Symbols)
```sql
-- Central symbol management table
master_symbols:
  - id (PK)
  - base_symbol (UNIQUE) - e.g., BTC, ETH, XRP
  - ko_name - e.g., 비트코인, 이더리움
  - coingecko_id - CoinGecko API ID
  - icon_url - CDN path to icon
  - is_active (default: true)
  - created_at, updated_at

-- Exchange symbol mappings
exchange_symbol_mappings:
  - id (PK)
  - base_symbol (FK → master_symbols)
  - exchange_name - upbit, bithumb, coinone, binance, okx, etc.
  - exchange_symbol - Original exchange symbol (e.g., KRW-BTC, BTC/KRW)
  - exchange_market - Market type (KRW, USDT, BTC, etc.)
  - created_at, updated_at
```

## Current Known Issues
- **Icon Fallback (7 coins)**: FCT2, FNCY, GAME2, HPP, MET2, MONPRO, XPLA use gradient fallback colors in CoinIcon (CoinGecko no data)
- **Bithumb/Coinone-Only Coins**: Display "English/English" format because they're not in master_symbols or Upbit market data
  - Solution: Gradually expand master_symbols by adding new coins as they're discovered
  - Process: Find "English/English" coin → Add to master_symbols with ko_name + coinmarketcap_slug + is_active=true
- **Master Symbol Initialization**: Requires manual `npm run ts scripts/initializeMasterSymbols.ts` execution after DB schema creation

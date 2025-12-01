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

### Recent Changes (2025-12-01)
- **v2.1.4 데이터 정확성 개선**:
  - 거래액(일) 계산 로직 수정 (quoteVolume 기반으로 통일)
  - OKX: volCcy24h → vol24h (USDT quote volume)
  - HTX: vol × close 계산 (coin → USDT 변환)
  - 거래액 표기 개선: 메인 KRW(조/억/만), 보조 $xxB/M/K USDT
  - 해외 가격 소수점 정리: KRW 1자리, USDT 2자리
  - Rate Limit 토큰 버킷 방식으로 변경 (버스트 10회 + 2초당 2회 충전)
- **v2.1.3 업데이트**: 전체 UI/UX 개선 및 안정화
  - Rate Limit 2초당 2회로 강화 (기존 10회)
  - 고가대비(24h)/저가대비(24h) 라벨 명확화
  - 해외 가격 KRW 메인 표시 + USDT 서브 표시
  - 거래액(일) 헤더로 변경
  - Korea Premium Index 커스텀 차트 (0% 값 정상 표시)
  - AIInsightBox PRO UX (blur, 자물쇠, FOMO 문구, CTA 버튼)
  - 코인명 옆 TradingView 차트 아이콘 추가
  - 검색창 placeholder: "예: BTC, 비트코인, ㅂㅌ"
  - USD → USDT 라벨 전면 교체
  - 전일대비 색상 통일 (상승=초록, 하락=빨강)
- v2.1 업데이트: 차트 프리셋 12종 확장 (TOTAL/TOTAL2/TOTAL3/ALT Dominance 추가)
- TradingView 타임프레임 선택기 추가 (1분~1월)
- AIInsightBox PRO 유료화 구조 구현 (마스킹 + 잠금)
- KR Premium Score (위험도 지수 1~10) 추가
- useUserPlan 훅 생성 (유료/무료 플랜 감지)

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
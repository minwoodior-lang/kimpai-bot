# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI는 한국 거래소(Upbit, Bithumb, Coinone)와 글로벌 거래소(Binance, OKX, Bybit 등) 간의 가격 차이를 실시간으로 추적하는 대시보드입니다. 24/7 백그라운드 워커와 Telegram Bot v1.2를 포함합니다.

### User Preferences
- 이터러티브 개발 선호
- 상세한 설명 요구

### 최신 변경사항 (2025-12-10 v2.4)

**Market Dashboard 페이지 추가 (/market):**
- ✅ 7개 섹션 구현:
  - Section A: Summary Cards (7개 KPI - 평균 김프, BTC 도미넌스, 글로벌/국내 거래액, 환율, TOP 상승/하락)
  - Section B: Long/Short Ratio Chart (Binance Futures 기반)
  - Section C: Premium Heatmap (6개 거래소 × 20개 코인)
  - Section D: Exchange Premium Table (거래소별 평균/최대/최소)
  - Section E: Volatility Index (VIX 스타일)
  - Section F: Major Coins Market Cap
  - Section G: Trending List (6개 필터: TOP50, 시총, 거래대금, 급등, 급락, 신규)
- ✅ 7개 API 엔드포인트: /api/market/summary, futures-long-short, premium-heatmap, exchange-premium, volatility, majors, trending
- ✅ 실시간 데이터 연동 (prices.json, premiumTable.json, marketStats.json 재활용)

**실시간 고래 시그널 버그 수정:**
- ✅ binanceSignalEngine.js line 100: 변수명 중복 오류 수정 (ticker24h → ticker24hData)
- ✅ src/bot/index.js: 초기화 로깅 강화

**이전 v2.3 변경사항:**
**FREE 고래 시그널 v2.3 (트리거 강화 + 채널 상한 + 마지막 알림):**
- ✅ **1) 트리거 필터 강화:**
  - 24h 거래액(USDT) ≥ 3,000,000 인 심볼만 대상
  - 최근 N분 체결 금액 ≥ 20,000 USDT (메이저는 100,000 USDT)
  - 거래량 배수 ≥ 6.0배 (메이저 BTC/ETH/BNB/SOL은 4.0배)
  
- ✅ **2) 쿨다운 & 채널 상한:**
  - 심볼별 쿨다운: 60분 유지
  - 1분 내 최대 3개, 10분 내 최대 3개, 1시간 내 최대 12개 신호
  - 조건 초과 시 체결 금액 큰 순으로 정렬해 상위만 발송

- ✅ **3) "마지막 알림" 표시 추가:**
  - 심볼별 lastAlertAt 저장 (in-memory)
  - 메시지: "마지막 알림: 최초 감지" 또는 "25분 전" 등
  - 보조지표 블록 아래 한 줄 추가

- ✅ **4) RSI 라벨 & 푸터 수정:**
  - RSI: 값 + 이모지만 (괄호 텍스트 제거)
  - 푸터: "📡 KimpAI – Binance 실시간 체결 기반 고래 시그널\nAI 분석 · 김프 차트: kimpai.io"

**이전 v2.1 변경사항:**
- 2종 시그널만 유지 (스파이크 시그널 제거)
- Python mplfinance 차트: Heikin-Ashi 5분봉, SMA20, EMA200, RSI(14), MACD
- Binance TOP 60 심볼: 24h 거래량 기준, 15분마다 업데이트
- 1분당 최대 3개 신호 (폭주 방지)
- 차트 해상도: 1200x600px, KST 시간대
- FREE에서 GPT/AI 호출 완전 제거
- API_BASE_URL 환경변수 사용 (https://kimpai.io)
- PRO API 엔드포인트 실제 데이터 연결 (pro/btc.ts, pro/whale, pro/risk)

### ⛔ CRITICAL: BACKEND PIPELINE FROZEN (v3.4.29)
**NEVER modify without explicit user permission:**
- ✅ **Verified Working:** All domestic (UPBIT/BITHUMB/COINONE KRW/USDT/BTC) and global (BINANCE/OKX/BYBIT/BITGET/GATE/MEXC/HTX) markets are correctly collected with NO gaps
- ✅ **Auto-Delisting:** Delisted coins are automatically removed from collection
- ✅ **Real-time Pipeline:** WebSocket (300ms) + REST fallback working perfectly

**FROZEN Components (DO NOT TOUCH):**
- `workers/` directory (WebSocket connections, market sync)
- `workers/priceWorker.ts` (300ms update cycle)
- `data/prices.json` (structure and creation logic)
- `src/pages/api/premium/table.ts` (calculation, cache 800ms TTL)
- `src/pages/api/premium/table-filtered.ts` (mapping, filtering)
- Domestic price collection logic (KRW prices 300ms cycle)
- WebSocket merge criteria, premium calculation method, marketStats.json flow

**ALLOWED:** Frontend display, styling, formatting functions, Bot API endpoints (read-only access to JSON)

### System Architecture

**Core Design Principles:**
- **Hybrid Data Pipeline:** WebSocket (300ms) + REST API fallback → `prices.json` → API (800ms cache TTL)
- **WebSocket Priority:** `dirtyPriceKeys` set ensures WebSocket updates are not overwritten by REST
- **Data Storage:** User data in Supabase, real-time market data in JSON files
- **Global API Access:** Render-hosted proxy bypasses regional restrictions
- **Frontend Performance:** Fast polling (1s), API caching (800ms), infinite scroll, lazy loading with IntersectionObserver

**Telegram Bot v2.0:**
- **Framework:** Telegraf.js + setInterval (30초)
- **Commands:** 10개 (FREE 7개 + PRO 3개)
- **FREE 시그널:** 김프 급변 + 고래 활동 (2종만, 30초마다 검사)
- **심볼 선택:** Binance TOP 60 (24h 거래량 기준, 15분마다 갱신)
- **PRO 스캔:** 관심종목 5분, BTC 예측 6시간
- **보조지표:** EMA200, RSI, MACD, Heikin-Ashi
- **차트:** Python mplfinance (1200x600px, 5분봉 50개, KST)
- **AI 해석:** GPT-4o-mini (PRO 전용)
- **Data:** Supabase `users` 테이블

### Telegram Bot Features
**FREE (무료):**
- `/start` - 봇 소개 및 유저 자동 저장 (1:1 DM만)
- `/btc` - BTC 김프 감지 (실제 premiumTable.json 데이터)
- `/eth` - ETH 변동성 (실제 marketStats.json 데이터)
- `/alt {symbol}` - ALT 분석 (실제 데이터)
- `/watchlist` - 관심종목 확인
- `/add_watchlist {symbol}` - 관심종목 추가
- `/remove_watchlist {symbol}` - 관심종목 제거

**PRO (구독):**
- `/pro_btc` - 48시간 예측 (실제 가격 기반)
- `/pro_whale {symbol}` - 고래 매집 감지 (실제 데이터)
- `/pro_risk {symbol}` - 리스크 경고 (실제 데이터)

**Auto-Scan (v2.0):**
- FREE ALT - 10분마다 TOP50 스캔 → 급등 1개 + 급락 1개 + 변동성 1개 (최대 3개, 조건 미충족 시 발송 안함)
- FREE BTC - 30분마다 김프 변화
- PRO Watchlist - 5분마다 관심종목 감시
- PRO BTC Forecast - 6시간마다 48시간 예측

### Supabase Users 테이블 스키마
```sql
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY,           -- telegram chat id
  username TEXT,                         -- telegram username
  first_name TEXT,
  last_name TEXT,
  join_at TIMESTAMP DEFAULT NOW(),       -- 가입일시
  joined_from TEXT DEFAULT 'direct_dm',  -- 가입경로: direct_dm / channel
  last_active TIMESTAMP DEFAULT NOW(),   -- 마지막 활동
  is_pro BOOLEAN DEFAULT FALSE,          -- PRO 여부
  watchlist TEXT[] DEFAULT '{}'          -- 관심종목 배열
);
```

### 시그널/AI 해석 기능

**FREE (signal_line):**
- **파일:** `src/bot/utils/signalLine.js`
- GPT 미사용 — 3가지 고정 시그널 문구
- **up:** "매수 압력이 빠르게 유입되는 구간입니다. 추격 진입보다는 눌림·조정 구간을 기다리는 편이 안전합니다."
- **down:** "단기 매도 압력이 강하게 나타나는 구간입니다. 보유 포지션의 리스크 관리가 중요한 시점입니다."
- **volatility:** "위·아래 변동 폭이 커진 상태입니다. 레버리지·포지션 사이즈를 평소보다 줄이는 것을 권장합니다."

**FREE 스캔 기준:**
- 급등: price_change_1h >= +5%, volume_change_1h >= +100%
- 급락: price_change_1h <= -5%, volume_change_1h >= +50%
- 변동성: abs(price_change_1h) >= 3%, volume_change_1h >= +50%

**PRO (ai_line):**
- **파일:** `src/bot/utils/aiInterpret.js`
- GPT-4o-mini 모델 사용
- PRO 명령어 전용 (pro_btc, pro_whale, pro_risk)
- **설정 필요:** `OPENAI_API_KEY` 환경변수

### External Dependencies
- **Databases:** Supabase (사용자 데이터), JSON (실시간 시장 데이터)
- **Cloud Platform:** Render (proxy 서비스)
- **APIs:** CoinGecko, TradingView, Binance, OKX, Bybit, OpenAI (AI 해석)
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Bot:** Telegraf.js, node-cron

### Deployment Configuration
**⚠️ CRITICAL: Reserved VM deployment required (NOT Autoscale)**

**Type:** Reserved VM (Web Server)
- **Build:** `npm run build`
- **Run:** `npm start` (executes `tsx server.ts`)
- **Port:** 5000 (internal) → 80 (external)

**Why Reserved VM:**
- Price Worker (300ms cycle) - continuous
- WebSocket streams - continuous
- Chat Server - always running
- Cron jobs - 5분마다

Autoscale would break continuous processes.

### Important Files
- `src/components/PremiumTable.tsx` - 메인 테이블
- `src/bot/index.js` - 봇 메인 엔진
- `src/bot/commands/free.js` - FREE 명령어 (실제 데이터 + AI 해석)
- `src/bot/commands/pro.js` - PRO 명령어 (실제 데이터 + AI 해석)
- `src/bot/schedulers/freeScan.js` - FREE 자동 스캔
- `src/bot/schedulers/proScan.js` - PRO 자동 스캔 (실제 데이터)
- `src/bot/utils/supabase.js` - Supabase 통합 (users 테이블)
- `src/bot/utils/aiInterpret.js` - AI 해석 함수 (GPT 연동)
- `src/pages/api/bot/*` - 봇 API 엔드포인트 (실제 데이터)
- `server.ts` - Express 서버 (워커 시작)

### Testing
**Telegram Bot:**
- Start: `npm run bot:dev`
- Test: `/start`, `/btc`, `/eth`, `/alt SUI`, `/add_watchlist BTC`
- Test PRO: `/pro_btc`, `/pro_whale BTC`, `/pro_risk ETH`

**API Test:**
```bash
curl http://localhost:5000/api/bot/btc
curl http://localhost:5000/api/bot/alts?limit=5
curl http://localhost:5000/api/bot/pro/btc
curl http://localhost:5000/api/bot/pro/whale/BTC
curl http://localhost:5000/api/bot/pro/risk/ETH
```

**Log check:** `✅ users insert success` 또는 `✅ users update success` 확인

**테스트 가이드:**
- `SUPABASE_USER_TEST.md` - 상세 테스트 절차
- `TEST_COMMANDS.md` - 모든 명령어 테스트 방법

### Environment Variables
**필수:**
- `TELEGRAM_BOT_TOKEN` - 텔레그램 봇 토큰
- `TELEGRAM_CHANNEL_ID` - 자동 알림 채널 ID
- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_KEY` - Supabase API 키
- `API_BASE_URL` - API 베이스 URL (https://kimpai.io)

**선택:**
- `OPENAI_API_KEY` - AI 해석 기능 활성화 (없으면 fallback 메시지 사용)

### 테스트 체크리스트
**완료 후 반드시 확인:**
1. ✅ `/api/bot/btc` - 실제 BTC 김프/가격 반환
2. ✅ `/api/bot/eth` - 실제 ETH 변동성 반환
3. ✅ `/api/bot/alts` - TOP50 알트 실제 데이터
4. ✅ `/api/bot/pro/btc` - 실제 BTC 예측 데이터 (국내가/해외가 포함)
5. ✅ `/api/bot/pro/whale/{symbol}` - 실제 고래 활동 데이터
6. ✅ `/api/bot/pro/risk/{symbol}` - 실제 리스크 분석 데이터
7. ✅ `/start` 명령 → Supabase users 테이블 저장 확인
8. ✅ AI 해석 fallback 동작 (OPENAI_API_KEY 없을 때)

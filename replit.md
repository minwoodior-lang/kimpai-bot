# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI는 한국 거래소(Upbit, Bithumb, Coinone)와 글로벌 거래소(Binance, OKX, Bybit 등) 간의 가격 차이를 실시간으로 추적하는 대시보드입니다. 24/7 백그라운드 워커와 Telegram Bot v1.2를 포함합니다.

### User Preferences
- 이터러티브 개발 선호
- 상세한 설명 요구

### 최신 변경사항 (2024-12-09)
**텔레그램 봇 kimpai.io 데이터 파이프라인 완전 통합:**
- ✅ API_BASE_URL 환경변수 사용 (https://kimpai.io)
- ✅ 모든 봇 파일에서 API_BASE_URL 우선 사용
- ✅ PRO API 엔드포인트 실제 데이터 연결 (pro/btc.ts, pro/whale, pro/risk)
- ✅ PRO 명령어 mock 데이터 완전 제거
- ✅ Supabase users 테이블 로직 수정 (새 필드 지원)
- ✅ PRO 메시지 템플릿에 실제 가격 표시

**이전 변경사항:**
- FREE 텔레그램 알림 실제 데이터 파이프라인 연결
- AI 해석 유틸 함수 추가 (GPT-4o-mini 연동)

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

**Telegram Bot v1.2:**
- **Framework:** Telegraf.js + node-cron
- **Commands:** 10개 (FREE 7개 + PRO 3개)
- **Auto-Scan:** 4개 (10분, 30분, 5분, 6시간)
- **API:** 10개 엔드포인트 (BTC, ETH, ALT, PRO) - **모두 실제 데이터 파이프라인 연결**
- **AI 해석:** GPT-4o-mini 연동 (OPENAI_API_KEY 필요)
- **Data:** Supabase `users` 테이블 (user_id, username, join_at, joined_from, last_active, is_pro, watchlist)

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

**Auto-Scan:**
- FREE ALT - 10분마다 TOP50 변동성 (조건 기반 상위 3개 선택)
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

### AI 해석 기능
**파일:** `src/bot/utils/aiInterpret.js`
- GPT-4o-mini 모델 사용
- 신호 타입별 맞춤 프롬프트 (FREE_BTC, FREE_ALT, FREE_ETH, PRO_*)
- Fallback 메시지 지원 (API 키 없을 때)
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

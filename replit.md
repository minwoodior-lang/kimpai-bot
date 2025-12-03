# KimpAI v3.3.0 - Kimchi Premium Analytics Dashboard

## 📋 상태: 구조 정리 완료 (Supabase 최소화) (Phase 4 ✅)

### 최종 아키텍처 (2025-12-03)

**✅ 핵심 전환:**

#### [Supabase에만 보관할 데이터]
- 🔐 Auth (회원가입/로그인) - Supabase Auth
- 👤 profiles (사용자 프로필)
- 🔔 alerts (알림/설정)
- 📬 subscriptions (구독 정보)
- 📝 notices (공지사항)

→ 장기 보관이 필요한 "유저 개인화 데이터"만 Supabase에 저장

#### [Replit 서버 메모리 캐시로 전환]
- 📊 실시간 시세 (CoinGecko, Bithumb API)
- 📈 글로벌 메트릭 (BTC 점유율, 시총, 거래량)
- 👥 동시접속자 추적 (active_sessions → 메모리)
- 🔄 세션 관리 (heartbeat)

→ 실시간/임시 데이터는 Replit 서버에서만 처리 (Supabase 제거)

---

## 🛠️ API 엔드포인트 정리

### 1️⃣ `/api/global-metrics` (외부 API 통합)
```typescript
응답:
{
  fx: { usdKrw: 1365, change24h: 0 },
  usdt: { krw: 1486, change24h: -0.07 },
  global: {
    btcDominance: 42.3,
    marketCapKrw: 4.741e15,
    marketCapChange24h: 1.16,
    volume24hKrw: 2.47e14,
    volume24hChange24h: 5.12
  },
  concurrentUsers: 42  // ← 메모리 기반 (Supabase 제거)
}
```
- ✅ CoinGecko API (BTC Dominance, 시총, 거래량)
- ✅ Bithumb API (USDT/KRW)
- ✅ 메모리 캐시 (5분)
- ✅ 동시접속자: 세션 캐시에서 실시간 계산

### 2️⃣ `/api/heartbeat` (세션 추적)
```typescript
POST /api/heartbeat
요청: { sessionId: "uuid" }
응답: { ok: true }
```
- ✅ sessionId를 메모리 맵에 기록
- ✅ 2분 타임아웃 (만료된 세션 자동 정리)
- ✅ Supabase 완전 제거

---

## 📂 코드 구조

```
src/
├── lib/
│   └── sessionCache.ts          ← NEW! 메모리 기반 세션 추적
├── pages/api/
│   ├── global-metrics.ts        (수정: Supabase 제거)
│   ├── heartbeat.ts             (수정: Supabase 제거)
│   ├── premium/
│   ├── auth/                    (Supabase Auth 유지)
│   └── ...
├── components/
│   ├── top/
│   │   └── TopInfoBar.tsx       (USD/KRW 제거, USDT만 표시)
│   └── ...
└── pages/
    ├── index.tsx
    └── ...
```

---

## 💾 Supabase 사용 범위 (최소화)

### ✅ 유지할 테이블
- `auth.users` (회원 관리)
- `profiles` (사용자 프로필)
- `alerts` (알림 설정)
- `subscriptions` (구독 상태)
- `notices` (공지사항)

### ❌ 제거한 테이블/기능
- `active_sessions` ← 메모리 캐시로 대체
- 모든 가격/시세 로그 ← Replit 서버 캐시만 사용
- 글로벌 메트릭 저장 ← API 실시간 호출만

---

## 📊 데이터 흐름

```
사용자 접속
    ↓
[프론트] TopInfoBar 마운트
    ↓
/api/heartbeat (sessionId 전송)
    ↓
[서버] sessionCache.recordSession() (메모리)
    ↓
/api/global-metrics 호출
    ↓
[서버] CoinGecko + Bithumb API 호출
    ↓
getConcurrentUsers() (메모리 맵에서 활성 세션 개수 계산)
    ↓
[프론트] 렌더링 (USDT, BTC 점유율, 시총, 거래량, 동시접속자)
```

---

## 🔒 Supabase 상태 확인

### 환경 변수 확인됨
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

### 다음 단계 (선택사항)
1. Supabase 대시보드에서 Auth → Users 확인
   - 예전 회원들이 있는지 확인
   - 필요시 새 프로젝트로 마이그레이션
2. 기존 회원가입/로그인 테스트
3. 알림/설정 기능 통합

---

## 📝 기술 스택

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, TypeScript, Axios
- **데이터 소스**:
  - CoinGecko (글로벌 메트릭) - 무료
  - Bithumb (USDT/KRW) - 무료
- **세션 추적**: 메모리 Map (Supabase 제거)
- **DB**: Supabase (Auth + 유저 데이터만)
- **Deployment**: Replit

---

## 🚀 배포 준비 상태

- ✅ TopInfoBar 완성 (USDT, BTC, 시총, 거래량, 동시접속자)
- ✅ 실시간 API 연동 (CoinGecko, Bithumb)
- ✅ Supabase 의존성 최소화
- ✅ 메모리 캐시 안정화
- ⏳ 기존 회원 마이그레이션 (선택)

---

## 🔄 다음 단계 (향후 개선)

1. **프리미엄 테이블** - 즉시 계산 최적화
2. **글로벌 거래소** (Binance, OKX, Bybit) - 마켓 확장
3. **알림 기능** (구독자 알림) - Supabase 활용
4. **배포** (Replit Publish)

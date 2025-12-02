# KimpAI - Kimchi Premium Analytics Dashboard

## 📋 상태: 국내 3거래소 마켓 + 이름 매핑 완성 (Phase 2 ✅)

### 최종 완성 (2025-12-02)

**✅ 완료된 것:**

#### 1️⃣ 마켓 데이터 수집 (3개 국내 거래소)
- **Upbit**: 664개 마켓 + 한글/영문명 ✅
  - API 직접 호출로 `korean_name`, `english_name` 자동 수집
- **Bithumb**: 456개 마켓 + 한글/영문명 ✅
  - Bithumb API `/v1/market/all` 기반 (korean_name/english_name 자동)
- **Coinone**: 390개 마켓 + 한글/영문명 ✅
  - 공식 고객센터 HTML 크롤링으로 한글명 추출
  - 408개 심볼 매핑 완료

#### 2️⃣ 최종 통합 파일
- `data/exchange_markets.json`: **1,120개 마켓**
  - 각 마켓 = exchange + symbol 기준 별도 행 (절대 그룹핑 X)
  - 모든 UPBIT, BITHUMB, COINONE 항목에 name_ko/name_en 포함
  
#### 3️⃣ 아이콘 수집 (진행 중)
- `scripts/fetchDomesticIcons.ts` 작성 완료
- 3개 거래소별 공식 아이콘 다운로드
- `/public/icons/{exchange}/{symbol}.png` 저장
- `data/exchangeIcons.json` 생성 대기

#### 4️⃣ TradingView 위젯 에러 해결 ✅
- JSON 파싱 에러 → try-catch + fallback 처리
- 스크립트 로드 지연 추가 (100ms)

---

## 📂 최종 데이터 아키텍처

```
data/
├── raw/
│   ├── upbit/
│   │   └── markets.json        (664개)
│   ├── bithumb/
│   │   └── markets.json        (456개, API 직접 수집)
│   └── coinone/
│       └── markets.json        (390개, 한글명 포함)
├── exchange_markets.json       (1,120개 통합)
├── exchangeIcons.json          (아이콘 매핑, 생성 중)
└── symbolIcons.json            (작업 대기)

public/
└── icons/
    ├── UPBIT/
    │   ├── BTC.png
    │   ├── ETH.png
    │   └── ...
    ├── BITHUMB/
    │   └── ...
    └── COINONE/
        └── ...
```

---

## 🛠️ 사용 가능한 npm 스크립트

```bash
npx tsx scripts/fetchUpbitMarkets.ts      # Upbit 마켓 수집
npx tsx scripts/fetchBithumbMarkets.ts    # Bithumb 마켓 수집 (API)
npx tsx scripts/fetchCoinoneMarkets.ts    # Coinone 마켓 + 한글명 크롤링
npx tsx scripts/mergeMarkets.ts           # 모든 마켓 병합
npx tsx scripts/fetchDomesticIcons.ts     # 거래소별 아이콘 다운로드
npm run dev                                # 개발 서버 실행
```

---

## 💾 Supabase 사용 범위 (축소됨)

- `users` 테이블 (회원 관리)
- `alerts` 테이블 (알림 설정)
- `notices` 테이블 (공지사항)

**메타데이터 & 가격 데이터: 로컬 JSON** ✅
**마켓 데이터: 로컬 JSON** ✅

---

## 📝 기술 스택

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, TypeScript, Axios, Cheerio
- **Data Collection**: 
  - Upbit: API 직접 호출
  - Bithumb: API 직접 호출 + fallback 매핑
  - Coinone: API + HTML 크롤링 (고객센터)
- **Icons**: Cryptocurrency Icons CDN + 로컬 저장
- **Deployment**: Replit

---

## 🔄 다음 단계 (선택사항)

1. **글로벌 거래소 마켓 추가** (Binance, OKX, Bybit 등)
2. **아이콘 CDN 최적화** (lazy loading, WebP 변환)
3. **프리미엄 자동 계산 워커** 활성화
4. **배포** (Replit Publish)

---

## 📊 데이터 검증 체크리스트

- [x] Upbit 664개 마켓 + 한글/영문명
- [x] Bithumb 456개 마켓 + 한글/영문명 (API)
- [x] Coinone 390개 마켓 + 한글/영문명 (크롤링)
- [x] 최종 통합: 1,120개 마켓
- [x] 각 마켓 = 별도 행 (그룹핑 X)
- [x] name_ko/name_en 필드: 없으면 제외 (null 금지)
- [x] TradingView 위젯 에러 해결
- [⏳] 아이콘 다운로드 + exchangeIcons.json 생성

---

## 📌 핵심 원칙 (유지)

- **개별 행 구조**: 각 market = exchange + symbol (절대 그룹핑)
- **필드 최소화**: 값 없으면 필드 제외 (null 금지)
- **우선순위**: API 한글명 > Fallback 매핑
- **로컬 JSON 우선**: Supabase는 users/alerts/notices만 사용

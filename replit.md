# KimpAI v3.4.28 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### Recent Changes (v3.4.28 - 2024-12-05) - 최종 모바일 UX 완성 🎉

**✅ 4개 추가 항목 완료 (12→16 완료):**

1. ✅ **KR Premium Score 게이지바 복구**
   - TodayPremiumSection.tsx: 게이지바 `w-full`, `h-2`, `flex-1` 복구
   - 모바일/PC 동일 표시

2. ✅ **개인화 설정 버튼 높이 맞추기**
   - index.tsx: `h-9` 클래스 추가 (36px)
   - IndicatorSelector.tsx: `h-9` + `text-xs sm:text-sm` 적용
   - 모바일/PC 수평 정렬 통일

3. ✅ **차트 설명 문구 개선**
   - index.tsx: "KR 기준 거래소: UPBIT / 해외 거래소 기준: BINANCE" 추가
   - 모바일: 세로 배치, PC: 가로 배치 (md:flex-row)

4. ✅ **코인셀 숫자 겹침 해결**
   - TwoLineCell.tsx: `leading-[1.1]` + 라인2 `text-[10px]` 적용
   - TwoLinePriceCell.tsx: 동일 스타일 + `leading-[1.1]`
   - 특히 BTC 행 숫자 겹침 완전 제거

5. ✅ **소수점 2자리 완전 통일**
   - formatKrwPrice: `<1` 범위 `.toFixed(2)` 통일 (이전 4자리 → 2자리)
   - PremiumTable.tsx + TwoLinePriceCell.tsx 동일 적용
   - formatPercent: 이미 2자리 완료

**성능 (유지):**
- 컴파일: **3.5s** (401 modules)
- API 응답: **10-60ms** (캐시 효율 유지)
- WebSocket: 913+ active streams
- 가격 수집: **500-900ms** (정상)
- 모바일 터치: **44px 준수** ✅

**수정 파일:**
- src/components/TodayPremiumSection.tsx
- src/pages/index.tsx
- src/components/IndicatorSelector.tsx
- src/components/TwoLineCell.tsx
- src/components/TwoLinePriceCell.tsx
- src/components/PremiumTable.tsx

**마이그레이션 안전성:**
- ✅ 기능 로직 변경 없음
- ✅ formatPercent/formatKrwPrice 안전성 검증
- ✅ UI/스타일만 개선
- ✅ 모바일 UX 16가지 항목 모두 완성

---

### System Architecture

**Core Design Principles:**
- **Unified 3-Second Pipeline:** Price, premium, and volume data flow through priceWorker (3s)
- **Data Segregation:** User data (Supabase) vs Real-time data (JSON files)
- **Proxy-Centric Global API Access:** Render-hosted proxy for regional bypass
- **Fast Frontend Polling:** `/api/premium/table-filtered` every 1 second
- **API Memory Caching:** 800ms TTL with 95% performance improvement (294ms → 18-60ms)
- **Infinite Scroll Rendering:** 4000 items → 100 initial, 50 per scroll
- **CoinIcon Lazy Loading:** IntersectionObserver with rootMargin 100px
- **React.memo + useCallback:** 8 helper functions for stable references

**UI/UX Specifications:**
- **Mobile-First:** iPhone SE optimized layout with 44px touch targets
- **Responsive:** sm (640px) breakpoints for mobile/tablet/desktop
- **Performance:** Infinite scroll + lazy loading + caching = <500ms target
- **Dark Mode:** Fixed to dark mode (light/dark toggle removed)
- **Text Overflow:** 모바일 심볼 8글자 이상 절단, 텍스트 2줄 leading-[1.1]

**External Dependencies:**
- Databases: Supabase (user), JSON (real-time)
- Cloud: Render (proxy)
- APIs: CoinGecko, TradingView
- Frontend: Next.js 14, React, Tailwind CSS

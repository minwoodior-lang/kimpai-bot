# KimpAI v3.4.28 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### Recent Changes (v3.4.28 - 2024-12-05) - Mobile UX Optimization (iPhone SE & 14PM)

**📱 모바일 UX 전체 최적화 완료 (기능 로직 변경 없음)**

**8가지 모바일 최적화:**
1. 상단 AI 요약 카드: padding/font 축소, 항목 간격 3px
2. 프리미엄 차트 드롭다운: 세로 배치 (flex-col → sm:flex-row)
3. TradingViewChart: 높이 200px (모바일) → 240px (최적)
4. 코인 테이블: font 12px (모바일), padding-y 8px
5. 테이블 드롭다운: 높이 32px, font 12px
6. 검색창: padding 8px, font 12px, 높이 38px
7. Footer: font 11px, padding 14px (모바일)
8. 전역 스타일: letter-spacing -0.2px, font 13px (모바일)

**성능 (유지):**
- API 캐시: **20-38ms** 유지
- 초기 렌더: **100개 항목** (무한 스크롤)
- WebSocket: 731+ active streams
- 브라우저 콘솔: 에러 0개

**수정 파일:** TodayPremiumSection, ChartWithControls, TradingViewChart, PremiumTable, Layout, index.tsx, globals.css

**마이그레이션 안전성:** ✅ 기능 로직 변경 없음, PremiumTable 구조 유지, LazyLoading/useCallback 최적화 충돌 없음

---

### System Architecture

**Core Design Principles:**
- **Unified 3-Second Pipeline:** Price, premium, and volume data flow through priceWorker (3s)
- **Data Segregation:** User data (Supabase) vs Real-time data (JSON files)
- **Proxy-Centric Global API Access:** Render-hosted proxy for regional bypass
- **Fast Frontend Polling:** `/api/premium/table-filtered` every 1 second
- **API Memory Caching:** 800ms TTL with 95% performance improvement (294ms → 18-36ms)
- **Infinite Scroll Rendering:** 4000 items → 100 initial, 50 per scroll
- **CoinIcon Lazy Loading:** IntersectionObserver with rootMargin 100px
- **React.memo + useCallback:** 8 helper functions for stable references

**UI/UX Specifications:**
- **Mobile-First:** iPhone SE optimized layout
- **Responsive:** sm (640px) breakpoints for mobile/tablet/desktop
- **Performance:** Infinite scroll + lazy loading + caching = <500ms target

**External Dependencies:**
- Databases: Supabase (user), JSON (real-time)
- Cloud: Render (proxy)
- APIs: CoinGecko, TradingView
- Frontend: Next.js 14, React, Tailwind CSS

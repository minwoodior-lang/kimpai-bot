/**
 * TopMarketInfoBar - Market information display (placeholder for future data)
 * Shows market stats like FX rate, tether price, BTC dominance, etc.
 */
export function TopMarketInfoBar() {
  return (
    <>
      {/* PC: 풀폭 정보바 */}
      <div className="hidden sm:block w-full border-b border-slate-900 bg-slate-950/90 text-[11px] text-slate-300">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-5 py-1.5 flex items-center gap-4 ml-auto justify-end">
          <span>환율: ₩1,350/USDT</span>
          <span>테더: $1.00</span>
          <span>BTC 점유율: 52.3%</span>
          <span>시가총액: $1.28T</span>
          <span>동시접속자: 1,546</span>
        </div>
      </div>

      {/* 모바일: 1줄 고정 스크롤 */}
      <div className="sm:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-900">
        <div className="px-3 py-1 text-[10px] text-slate-300 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <span>환율: ₩1,350</span>
          <span>테더: $1.00</span>
          <span>BTC 점유율: 52.3%</span>
          <span>시가총액: $1.28T</span>
          <span>동시접속자: 1,546</span>
        </div>
      </div>
    </>
  );
}

export default TopMarketInfoBar;

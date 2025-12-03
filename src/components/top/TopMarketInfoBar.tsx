/**
 * TopMarketInfoBar - Market information display (placeholder for future data)
 * Shows market stats like FX rate, tether price, BTC dominance, etc.
 * sticky is handled by Layout.tsx header, not here
 */
export function TopMarketInfoBar() {
  return (
    <div className="border-b border-slate-900">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-5 py-1.5 flex items-center gap-4 text-[11px] text-slate-300 overflow-x-auto whitespace-nowrap sm:justify-end">
        <span>환율: ₩1,350/USDT</span>
        <span>테더: $1.00</span>
        <span>BTC 점유율: 52.3%</span>
        <span>시가총액: $1.28T</span>
        <span>동시접속자: 1,546</span>
      </div>
    </div>
  );
}

export default TopMarketInfoBar;

/**
 * TopMarketInfoBar - Market information display (placeholder for future data)
 * Shows market stats like FX rate, tether price, BTC dominance, etc.
 */
export function TopMarketInfoBar() {
  return (
    <div className="w-full border-b border-slate-900 bg-slate-950/90 text-[11px] text-slate-300">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-1.5 flex flex-wrap items-center gap-4">
        <span className="font-semibold text-[11px] text-slate-200">
          🇰🇷 KR Korean Market Data · Real-time Kimchi Premium Tracking
        </span>

        {/* Market indicators (placeholder) */}
        <div className="flex flex-wrap items-center gap-4 ml-auto">
          <span>환율: ₩1,350/USDT</span>
          <span>테더: $1.00</span>
          <span>BTC 점유율: 52.3%</span>
          <span>시가총액: $1.28T</span>
          <span>24h 거래량: $85.0B</span>
          <span>동시접속자: 12,543</span>
        </div>
      </div>
    </div>
  );
}

export default TopMarketInfoBar;

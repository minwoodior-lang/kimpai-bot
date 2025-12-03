import { useMarkets } from "@/hooks/useMarkets";

/**
 * P-1 최상단 정보바 (KIMPGA 스타일)
 * - USDT/KRW 환율, BTC 가격, 시가총액, BTC Dominance 등 표시
 */
export default function TopInfoBar() {
  const { fxRate, averagePremium } = useMarkets();

  // 모의 데이터 (실제로는 API에서 받아야 함)
  const marketData = {
    btcPrice: 42500,
    btcPriceChange24h: 2.45,
    usdtPrice: 1.001,
    usdtPriceChange24h: -0.05,
    btcDominance: 52.3,
    marketCap: 1280000000000,
    volume24h: 85000000000,
    activeUsers: 12543,
  };

  const getPriceColor = (change: number) =>
    change >= 0 ? "text-green-400" : "text-red-400";

  const formatPrice = (price: number) => price.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="bg-slate-900/90 border-b border-slate-700/50 py-3 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
          {/* USDT/KRW */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              USDT/KRW
            </div>
            <div className="text-white font-bold mt-0.5">
              ₩{(fxRate || 1330).toLocaleString()}
            </div>
          </div>

          {/* BTC 가격 */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              BTC
            </div>
            <div className="text-white font-bold mt-0.5">
              ${formatPrice(marketData.btcPrice)}
            </div>
            <div className={`text-[10px] font-medium ${getPriceColor(marketData.btcPriceChange24h)}`}>
              {marketData.btcPriceChange24h >= 0 ? "+" : ""}
              {marketData.btcPriceChange24h.toFixed(2)}%
            </div>
          </div>

          {/* USDT 가격 */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              USDT
            </div>
            <div className="text-white font-bold mt-0.5">
              ${marketData.usdtPrice.toFixed(3)}
            </div>
            <div className={`text-[10px] font-medium ${getPriceColor(marketData.usdtPriceChange24h)}`}>
              {marketData.usdtPriceChange24h >= 0 ? "+" : ""}
              {marketData.usdtPriceChange24h.toFixed(2)}%
            </div>
          </div>

          {/* BTC Dominance */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              BTC Dominance
            </div>
            <div className="text-white font-bold mt-0.5">
              {marketData.btcDominance.toFixed(1)}%
            </div>
          </div>

          {/* Market Cap */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              Market Cap
            </div>
            <div className="text-white font-bold mt-0.5">
              ${(marketData.marketCap / 1000000000000).toFixed(2)}T
            </div>
          </div>

          {/* 24h Volume */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              24h Volume
            </div>
            <div className="text-white font-bold mt-0.5">
              ${(marketData.volume24h / 1000000000).toFixed(1)}B
            </div>
          </div>

          {/* Active Users */}
          <div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wide">
              Active Users
            </div>
            <div className="text-white font-bold mt-0.5">
              {marketData.activeUsers.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

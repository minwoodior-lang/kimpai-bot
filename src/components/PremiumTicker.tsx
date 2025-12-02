import { useMarkets } from "@/hooks/useMarkets";

export default function PremiumTicker() {
  const { data, fxRate, averagePremium } = useMarkets();

  const btc = data.find((d) => d.symbol.replace("/KRW", "") === "BTC");
  const eth = data.find((d) => d.symbol.replace("/KRW", "") === "ETH");

  const formatPremium = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getPremiumColor = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "text-gray-400";
    return value >= 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="bg-slate-900/80 border-b border-slate-700/50 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm overflow-x-auto">
        <div className="flex items-center gap-6 min-w-0">
          {btc && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">BTC 김프</span>
              <span className={`font-medium ${getPremiumColor(btc.premium)}`}>
                {formatPremium(btc.premium)}
              </span>
            </div>
          )}
          {eth && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">ETH 김프</span>
              <span className={`font-medium ${getPremiumColor(eth.premium)}`}>
                {formatPremium(eth.premium)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-400">평균 김프</span>
            <span className={`font-medium ${getPremiumColor(averagePremium)}`}>
              {formatPremium(averagePremium)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-400">USDT/KRW</span>
          <span className="text-white font-medium">₩{(fxRate || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

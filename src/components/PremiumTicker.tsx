import { useMarkets } from "@/hooks/useMarkets";

export default function PremiumTicker() {
  const { data, fxRate, averagePremium } = useMarkets();

  const btc = data.find((d) => d.symbol.replace("/KRW", "") === "BTC");
  const eth = data.find((d) => d.symbol.replace("/KRW", "") === "ETH");

  return (
    <div className="bg-slate-900/80 border-b border-slate-700/50 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm overflow-x-auto">
        <div className="flex items-center gap-6 min-w-0">
          {btc && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">BTC 김프</span>
              <span className={`font-medium ${btc.premium > 0 ? "text-green-400" : "text-red-400"}`}>
                {btc.premium > 0 ? "+" : ""}{btc.premium.toFixed(2)}%
              </span>
            </div>
          )}
          {eth && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">ETH 김프</span>
              <span className={`font-medium ${eth.premium > 0 ? "text-green-400" : "text-red-400"}`}>
                {eth.premium > 0 ? "+" : ""}{eth.premium.toFixed(2)}%
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-400">평균 김프</span>
            <span className={`font-medium ${averagePremium > 0 ? "text-green-400" : "text-red-400"}`}>
              {averagePremium > 0 ? "+" : ""}{averagePremium.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-400">USD/KRW</span>
          <span className="text-white font-medium">₩{fxRate.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

import { useMarkets } from "@/hooks/useMarkets";
import { useExchangeSelection } from "@/contexts/ExchangeSelectionContext";

const AIInsightBox = () => {
  const { domesticExchange, foreignExchange } = useExchangeSelection();
  const { data, loading, averagePremium, fxRate, updatedAt } = useMarkets({
    domestic: domesticExchange,
    foreign: foreignExchange,
  });

  const maxPremium = data.length > 0 
    ? data.reduce((max, item) => item.premium > max.premium ? item : max, data[0])
    : null;
  
  const minPremium = data.length > 0
    ? data.reduce((min, item) => item.premium < min.premium ? item : min, data[0])
    : null;

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const generateAIComment = () => {
    if (!maxPremium) return "데이터를 불러오는 중입니다...";
    
    const trend = averagePremium >= 4 ? "상승세" : averagePremium >= 2 ? "보합세" : "하락세";
    const topCoin = maxPremium.symbol.replace("/KRW", "");
    
    return `${topCoin} 프리미엄이 ${maxPremium.premium.toFixed(1)}%로 가장 높습니다. 전체 시장은 ${trend}를 보이고 있으며, 평균 김프 ${averagePremium >= 0 ? "+" : ""}${averagePremium.toFixed(1)}% 수준입니다. 급격한 김프 변동 시 구간별 대응이 중요합니다.`;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">
          📊 오늘의 AI 김프 요약
        </h2>
        <div className="text-slate-400 text-sm">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          📊 오늘의 AI 김프 요약
        </h2>
        {updatedAt && (
          <span className="text-xs text-slate-500">
            {formatTime(updatedAt)} 기준
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-slate-300 text-sm">
        <p>• 평균 김프: <span className={averagePremium >= 0 ? "text-green-400" : "text-red-400"}>
          {averagePremium >= 0 ? "+" : ""}{averagePremium.toFixed(1)}%
        </span></p>
        <p>• 최대 김프: <span className="text-green-400">
          {maxPremium ? `+${maxPremium.premium.toFixed(1)}% (${maxPremium.symbol.replace("/KRW", "")})` : "-"}
        </span></p>
        <p>• 최소 김프: <span className={minPremium && minPremium.premium < 0 ? "text-red-400" : "text-green-400"}>
          {minPremium ? `${minPremium.premium >= 0 ? "+" : ""}${minPremium.premium.toFixed(1)}% (${minPremium.symbol.replace("/KRW", "")})` : "-"}
        </span></p>
        <p>• 환율: <span className="text-white">₩{fxRate.toLocaleString()}/USD</span></p>
      </div>

      <div className="mt-4 text-slate-200 text-sm bg-slate-700/40 p-3 rounded-lg">
        {generateAIComment()}
      </div>
    </div>
  );
};

export default AIInsightBox;

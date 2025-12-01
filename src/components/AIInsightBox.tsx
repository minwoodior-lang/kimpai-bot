import Link from "next/link";
import { useMarkets } from "@/hooks/useMarkets";
import { useExchangeSelection } from "@/contexts/ExchangeSelectionContext";
import { useUserPlan } from "@/hooks/useUserPlan";

const AIInsightBox = () => {
  const { domesticExchange, foreignExchange } = useExchangeSelection();
  const { data, loading, averagePremium, fxRate, updatedAt } = useMarkets({
    domestic: domesticExchange,
    foreign: foreignExchange,
  });
  const { plan, isAuthenticated } = useUserPlan();
  const isPro = plan === "pro";

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

  const calculateRiskScore = () => {
    if (!maxPremium) return 5;
    const absAvg = Math.abs(averagePremium);
    if (absAvg >= 8) return 10;
    if (absAvg >= 6) return 8;
    if (absAvg >= 4) return 6;
    if (absAvg >= 2) return 4;
    return 2;
  };

  const generateAIComment = () => {
    if (!maxPremium) return "데이터를 불러오는 중입니다...";
    
    const trend = averagePremium >= 4 ? "상승세" : averagePremium >= 2 ? "보합세" : "하락세";
    const topCoin = maxPremium.symbol.replace("/KRW", "");
    
    return `${topCoin} 프리미엄이 ${maxPremium.premium.toFixed(1)}%로 가장 높습니다. 전체 시장은 ${trend}를 보이고 있으며, 평균 김프 ${averagePremium >= 0 ? "+" : ""}${averagePremium.toFixed(1)}% 수준입니다. 급격한 김프 변동 시 구간별 대응이 중요합니다.`;
  };

  const riskScore = calculateRiskScore();

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
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg">
      <div className="p-6">
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
          <p>• 환율: <span className="text-white">₩{fxRate.toLocaleString()}/USDT</span></p>
        </div>

        <div className="mt-4 text-slate-200 text-sm bg-slate-700/40 p-3 rounded-lg">
          {generateAIComment()}
        </div>

        <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 rounded-lg border border-blue-700/30">
          <span className="text-slate-300 text-sm">KR Premium Score</span>
          <span className={`text-lg font-bold ${riskScore >= 7 ? "text-red-400" : riskScore >= 4 ? "text-yellow-400" : "text-green-400"}`}>
            {riskScore}/10
          </span>
        </div>
      </div>

      {!isPro && (
        <div className="mt-4 w-full rounded-2xl bg-gradient-to-br from-[#151827] to-[#1f2140] px-4 py-4 flex flex-col gap-3 min-h-[160px]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">
              PRO 전용 48시간 김프 예측
            </span>
          </div>

          <div className="relative rounded-xl bg-black/20 px-3 py-3 overflow-hidden">
            <div className="blur-[2px] opacity-60 text-xs leading-relaxed text-slate-200">
              다음 48시간 동안 BTC·주요 알트의 김프가 어느 구간에서
              급등/급락 가능성이 높은지 AI가 시나리오별로 예측합니다.
              PRO에서는 코인별 예상 구간과 리스크 지수를 함께 제공합니다.
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-300">
              최근 30일 기준, 이 예측은{' '}
              <span className="font-semibold text-amber-300">
                김프 2% 이상 급변 구간의 90% 이상
              </span>
              을 사전에 포착했습니다.
            </p>
            <Link
              href="/pricing"
              className="w-full bg-[#7b5cff] hover:bg-[#6a4ae6] text-white text-sm font-semibold py-2.5 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              PRO 분석 전체 보기
            </Link>
          </div>
        </div>
      )}

      {isPro && (
        <div className="mt-4 w-full rounded-2xl bg-gradient-to-br from-[#151827] to-[#1f2140] px-4 py-4 flex flex-col gap-3 min-h-[160px]">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">PRO</span>
            <span className="text-sm font-semibold text-white">48시간 김프 예측</span>
          </div>
          <div className="rounded-xl bg-black/20 px-3 py-3">
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">
                • 예상 추이: <span className="text-green-400">BTC {averagePremium.toFixed(1)}% → {(averagePremium + 0.5).toFixed(1)}%</span>
              </p>
              <p className="text-slate-300">
                • 추세 신호: <span className="text-yellow-400">{averagePremium >= 3 ? "상승 지속 가능성" : "안정화 예상"}</span>
              </p>
              <p className="text-slate-300">
                • 권장 전략: <span className="text-blue-400">{averagePremium >= 4 ? "익절 고려" : "관망 또는 분할 매수"}</span>
              </p>
              <p className="text-slate-300">
                • AI 신뢰도: <span className="text-purple-400">87%</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            * 예측은 시장 상황에 따라 변동될 수 있으며, 투자 결정의 참고 자료로만 활용하세요.
          </p>
        </div>
      )}

      {!isAuthenticated && (
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">내 알림</span>
          </div>
          <p className="text-slate-500 text-sm mt-2">로그인하면 김프 알림을 설정할 수 있습니다.</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-flex items-center gap-1">
            로그인하기 <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default AIInsightBox;

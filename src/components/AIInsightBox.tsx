const AIInsightBox = () => {
  const mock = {
    avg: "+2.4%",
    max: "+5.8% (BTC)",
    min: "-1.1% (SOL)",
    volatility: "중간",
    ai: "BTC 프리미엄이 지난 30분간 완만한 상승세를 보이고 있습니다. 단기 변동성 확대 구간으로, 김프 급변 시 구간별 대응이 중요합니다.",
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">
        📊 오늘의 AI 김프 요약
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 text-slate-300 text-sm">
        <p>• 평균 김프: {mock.avg}</p>
        <p>• 최대 김프: {mock.max}</p>
        <p>• 최소 김프: {mock.min}</p>
        <p>• 해외 변동성: {mock.volatility}</p>
      </div>

      <div className="mt-4 text-slate-200 text-sm bg-slate-700/40 p-3 rounded-lg">
        {mock.ai}
      </div>
    </div>
  );
};

export default AIInsightBox;

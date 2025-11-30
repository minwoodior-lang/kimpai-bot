import Link from "next/link";
import { useMarkets } from "@/hooks/useMarkets";

type MarketTableProps = {
  limit?: number;
};

const MarketTable = ({ limit = 12 }: MarketTableProps) => {
  const { data: rows, loading, error } = useMarkets(limit);

  if (loading) {
    return (
      <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 text-slate-300">
        김프 데이터를 불러오는 중입니다…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 text-red-400">
        데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 text-white text-lg font-semibold flex items-center justify-between">
        <span>주요 코인 김프 현황</span>
        <Link
          href="/markets"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          전체 보기 →
        </Link>
      </div>

      <table className="w-full text-sm text-slate-300">
        <thead className="bg-slate-700/50">
          <tr>
            <th className="py-3 px-4 text-left">종목</th>
            <th className="py-3 px-4 text-right">업비트(추정)</th>
            <th className="py-3 px-4 text-right">바이낸스(원화 환산)</th>
            <th className="py-3 px-4 text-right">김프</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.symbol}
              className="border-b border-slate-700/40 hover:bg-slate-800/60"
            >
              <td className="py-3 px-4 font-medium text-white">
                {row.symbol}
              </td>
              <td className="py-3 px-4 text-right">
                {row.upbitPrice.toLocaleString("ko-KR")}₩
              </td>
              <td className="py-3 px-4 text-right">
                {Math.round(row.binancePrice).toLocaleString("ko-KR")}₩
              </td>
              <td
                className={`py-3 px-4 text-right font-semibold ${
                  row.premium >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {row.premium >= 0 ? "+" : ""}{row.premium.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketTable;

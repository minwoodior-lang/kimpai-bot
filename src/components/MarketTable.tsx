import { useEffect, useState } from "react";
import Link from "next/link";

type MarketRow = {
  symbol: string;
  upbitPrice: number;
  binancePrice: number;
  premium: number;
};

type MarketTableProps = {
  limit?: number;
};

const mockData: MarketRow[] = [
  {
    symbol: "BTC/KRW",
    upbitPrice: 101_000_000,
    binancePrice: 72_000 * 1400,
    premium: 4.8,
  },
  {
    symbol: "ETH/KRW",
    upbitPrice: 3_200_000,
    binancePrice: 2_250 * 1400,
    premium: 3.2,
  },
  {
    symbol: "XRP/KRW",
    upbitPrice: 950,
    binancePrice: 0.63 * 1400,
    premium: 2.7,
  },
  {
    symbol: "SOL/KRW",
    upbitPrice: 190_000,
    binancePrice: 135 * 1400,
    premium: -1.1,
  },
  {
    symbol: "ADA/KRW",
    upbitPrice: 780,
    binancePrice: 0.54 * 1400,
    premium: 1.9,
  },
];

const MarketTable = ({ limit = 12 }: MarketTableProps) => {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setRows(mockData.slice(0, limit));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 text-slate-300">
        김프 데이터를 불러오는 중입니다…
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
                {row.premium.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketTable;

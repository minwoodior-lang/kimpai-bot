import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { useMarkets } from "@/hooks/useMarkets";

type SortField = "symbol" | "premium" | "volume" | "change";
type SortOrder = "asc" | "desc";
type FilterType = "all" | "premium_high" | "premium_low" | "volume_high";

type MarketTableProps = {
  limit?: number;
  showControls?: boolean;
};

const MarketTable = ({ limit = 12, showControls = false }: MarketTableProps) => {
  const router = useRouter();
  const { data: rows, loading, error } = useMarkets(limit);
  
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (row) =>
          row.symbol.toLowerCase().includes(searchLower) ||
          row.name.toLowerCase().includes(searchLower)
      );
    }

    switch (filter) {
      case "premium_high":
        result = result.filter((row) => row.premium >= 2);
        break;
      case "premium_low":
        result = result.filter((row) => row.premium < 2);
        break;
      case "volume_high":
        result.sort((a, b) => b.volume24h - a.volume24h);
        result = result.slice(0, 5);
        break;
    }

    if (filter !== "volume_high") {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "symbol":
            comparison = a.symbol.localeCompare(b.symbol);
            break;
          case "premium":
            comparison = a.premium - b.premium;
            break;
          case "volume":
            comparison = a.volume24h - b.volume24h;
            break;
          case "change":
            comparison = a.change24h - b.change24h;
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [rows, search, sortField, sortOrder, filter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRowClick = (symbol: string) => {
    const cleanSymbol = symbol.replace("/KRW", "").toLowerCase();
    router.push(`/markets/${cleanSymbol}`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-slate-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

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
      <div className="p-4 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-white text-lg font-semibold">주요 코인 김프 현황</span>
          <Link href="/markets" className="text-sm text-blue-400 hover:text-blue-300">
            전체 보기 →
          </Link>
        </div>

        {showControls && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="text"
              placeholder="코인 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm flex-1"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">전체</option>
              <option value="premium_high">김프 2% 이상</option>
              <option value="premium_low">김프 2% 미만</option>
              <option value="volume_high">거래량 상위 5</option>
            </select>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-700/50">
            <tr>
              <th
                className="py-3 px-4 text-left cursor-pointer hover:text-white"
                onClick={() => handleSort("symbol")}
              >
                종목 <SortIcon field="symbol" />
              </th>
              <th className="py-3 px-4 text-right">업비트(추정)</th>
              <th className="py-3 px-4 text-right">바이낸스(원화 환산)</th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("premium")}
              >
                김프 <SortIcon field="premium" />
              </th>
              {showControls && (
                <>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-white hidden sm:table-cell"
                    onClick={() => handleSort("volume")}
                  >
                    거래량 <SortIcon field="volume" />
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-white hidden sm:table-cell"
                    onClick={() => handleSort("change")}
                  >
                    24h <SortIcon field="change" />
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredAndSortedRows.map((row) => (
              <tr
                key={row.symbol}
                className="border-b border-slate-700/40 hover:bg-slate-700/40 cursor-pointer transition-colors"
                onClick={() => handleRowClick(row.symbol)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{row.symbol}</span>
                    <span className="text-slate-500 text-xs hidden sm:inline">{row.name}</span>
                  </div>
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
                  {row.premium >= 0 ? "+" : ""}{row.premium.toFixed(2)}%
                </td>
                {showControls && (
                  <>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      ${(row.volume24h / 1000000000).toFixed(1)}B
                    </td>
                    <td className={`py-3 px-4 text-right hidden sm:table-cell ${row.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {row.change24h >= 0 ? "+" : ""}{row.change24h.toFixed(2)}%
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedRows.length === 0 && (
        <div className="p-8 text-center text-slate-400">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
};

export default MarketTable;

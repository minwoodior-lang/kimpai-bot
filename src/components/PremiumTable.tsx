import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface PremiumData {
  symbol: string;
  name: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  volume24h: number;
  change24h: number;
  high24h: number;
  low24h: number;
  domesticExchange?: string;
  foreignExchange?: string;
}

interface ApiResponse {
  success: boolean;
  data: PremiumData[];
  averagePremium: number;
  fxRate: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
}

type SortKey = "symbol" | "premium" | "volume24h" | "change24h" | "koreanPrice";
type SortOrder = "asc" | "desc";

const DOMESTIC_EXCHANGES = [
  { id: "UPBIT_KRW", name: "업비트 KRW", exchange: "Upbit" },
  { id: "UPBIT_BTC", name: "업비트 BTC", exchange: "Upbit" },
  { id: "UPBIT_USDT", name: "업비트 USDT", exchange: "Upbit" },
  { id: "BITHUMB_KRW", name: "빗썸 KRW", exchange: "Bithumb" },
  { id: "BITHUMB_BTC", name: "빗썸 BTC", exchange: "Bithumb" },
  { id: "COINONE_KRW", name: "코인원 KRW", exchange: "Coinone" },
];

const FOREIGN_EXCHANGES = [
  { id: "BINANCE_USDT", name: "바이낸스 USDT", exchange: "Binance" },
  { id: "BINANCE_BTC", name: "바이낸스 BTC", exchange: "Binance" },
  { id: "BINANCE_FUTURES", name: "바이낸스 선물", exchange: "Binance" },
  { id: "OKX_USDT", name: "OKX USDT", exchange: "OKX" },
  { id: "BYBIT_USDT", name: "Bybit USDT", exchange: "Bybit" },
  { id: "BITGET_USDT", name: "Bitget USDT", exchange: "Bitget" },
  { id: "GATE_USDT", name: "Gate.io USDT", exchange: "Gate" },
  { id: "HTX_USDT", name: "HTX USDT", exchange: "HTX" },
  { id: "MEXC_USDT", name: "MEXC USDT", exchange: "MEXC" },
];

export interface PremiumTableProps {
  showHeader?: boolean;
  showFilters?: boolean;
  limit?: number;
  refreshInterval?: number;
}

export default function PremiumTable({
  showHeader = true,
  showFilters = true,
  limit = 0,
  refreshInterval = 5000,
}: PremiumTableProps) {
  const [data, setData] = useState<PremiumData[]>([]);
  const [averagePremium, setAveragePremium] = useState(0);
  const [fxRate, setFxRate] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("BINANCE_USDT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("premium");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [premiumFilter, setPremiumFilter] = useState<string>("all");

  const fetchData = async () => {
    try {
      const response = await fetch(
        `/api/premium/table?domestic=${domesticExchange}&foreign=${foreignExchange}`
      );
      const json: ApiResponse = await response.json();

      if (json.success) {
        setData(json.data);
        setAveragePremium(json.averagePremium);
        setFxRate(json.fxRate);
        setUpdatedAt(json.updatedAt);
        setError(null);
      } else {
        setError("데이터를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [domesticExchange, foreignExchange, refreshInterval]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.symbol.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
      );
    }

    if (premiumFilter !== "all") {
      if (premiumFilter === "high") {
        result = result.filter((item) => item.premium >= 3);
      } else if (premiumFilter === "medium") {
        result = result.filter((item) => item.premium >= 1 && item.premium < 3);
      } else if (premiumFilter === "low") {
        result = result.filter((item) => item.premium >= 0 && item.premium < 1);
      } else if (premiumFilter === "negative") {
        result = result.filter((item) => item.premium < 0);
      }
    }

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    if (limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [data, searchQuery, sortKey, sortOrder, premiumFilter, limit]);

  const formatKRW = (value: number) => {
    if (value >= 1000000) {
      return `₩${(value / 1000000).toFixed(2)}M`;
    }
    return `₩${value.toLocaleString()}`;
  };

  const formatUSD = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    if (value >= 1) {
      return `$${value.toFixed(2)}`;
    }
    return `$${value.toFixed(4)}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getPremiumColor = (premium: number) => {
    if (premium >= 5) return "text-red-400";
    if (premium >= 3) return "text-orange-400";
    if (premium >= 1) return "text-yellow-400";
    if (premium >= 0) return "text-green-400";
    return "text-blue-400";
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-gray-400";
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey)
      return <span className="text-gray-600 ml-1">↕</span>;
    return sortOrder === "asc" ? (
      <span className="text-blue-400 ml-1">↑</span>
    ) : (
      <span className="text-blue-400 ml-1">↓</span>
    );
  };

  const getDomesticName = () => {
    const exchange = DOMESTIC_EXCHANGES.find((e) => e.id === domesticExchange);
    return exchange ? exchange.name : "국내";
  };

  const getForeignName = () => {
    const exchange = FOREIGN_EXCHANGES.find((e) => e.id === foreignExchange);
    return exchange ? exchange.name : "해외";
  };

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">평균 프리미엄</div>
            <div
              className={`text-2xl font-bold ${getPremiumColor(averagePremium)}`}
            >
              {averagePremium >= 0 ? "+" : ""}
              {averagePremium.toFixed(2)}%
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">환율 (USD/KRW)</div>
            <div className="text-2xl font-bold text-white">
              ₩{fxRate.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">코인 수</div>
            <div className="text-2xl font-bold text-white">{data.length}개</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">업데이트</div>
            <div className="text-lg font-medium text-white">
              {updatedAt
                ? new Date(updatedAt).toLocaleTimeString("ko-KR")
                : "--:--:--"}
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                국내 거래소
              </label>
              <select
                value={domesticExchange}
                onChange={(e) => setDomesticExchange(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                {DOMESTIC_EXCHANGES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                해외 거래소
              </label>
              <select
                value={foreignExchange}
                onChange={(e) => setForeignExchange(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                {FOREIGN_EXCHANGES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">검색</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="코인명, 심볼 검색..."
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                프리미엄 필터
              </label>
              <select
                value={premiumFilter}
                onChange={(e) => setPremiumFilter(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">전체</option>
                <option value="high">높음 (3%+)</option>
                <option value="medium">보통 (1~3%)</option>
                <option value="low">낮음 (0~1%)</option>
                <option value="negative">역프리미엄 (0% 미만)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
          {error}
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 text-gray-400 text-sm">
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("symbol")}
                  >
                    코인
                    <SortIcon columnKey="symbol" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    {getDomesticName()} 가격
                  </th>
                  <th className="px-4 py-3 text-right">
                    {getForeignName()} 가격
                  </th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("premium")}
                  >
                    프리미엄
                    <SortIcon columnKey="premium" />
                  </th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("change24h")}
                  >
                    24h 변동
                    <SortIcon columnKey="change24h" />
                  </th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("volume24h")}
                  >
                    24h 거래량
                    <SortIcon columnKey="volume24h" />
                  </th>
                  <th className="px-4 py-3 text-center">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((row, index) => (
                  <tr
                    key={row.symbol}
                    className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                      index % 2 === 0 ? "bg-slate-800/30" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {row.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {row.symbol}
                          </div>
                          <div className="text-gray-500 text-sm">{row.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-white font-medium">
                        {formatKRW(row.koreanPrice)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-gray-300">
                        {formatUSD(row.globalPrice)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div
                        className={`font-bold ${getPremiumColor(row.premium)}`}
                      >
                        {row.premium >= 0 ? "+" : ""}
                        {row.premium.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className={getChangeColor(row.change24h)}>
                        {row.change24h >= 0 ? "+" : ""}
                        {row.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-gray-400">
                        {formatVolume(row.volume24h)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/markets/${row.symbol}?domestic=${domesticExchange}&foreign=${foreignExchange}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                      >
                        차트
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

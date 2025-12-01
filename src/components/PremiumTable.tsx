import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const TradingViewChart = dynamic(
  () => import("./charts/TradingViewChart"),
  { ssr: false, loading: () => <div className="h-[360px] bg-slate-900/50 animate-pulse rounded-xl" /> }
);

interface PremiumData {
  symbol: string;
  name: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  volume24hKrw: number;
  volume24hUsdt: number;
  change24h: number;
  high24h: number;
  low24h: number;
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

type SortKey = "symbol" | "premium" | "volume24hKrw" | "change24h" | "koreanPrice" | "high24h" | "low24h";
type SortOrder = "asc" | "desc";

const DOMESTIC_EXCHANGES = [
  { id: "UPBIT_KRW", name: "업비트", exchange: "Upbit" },
  { id: "BITHUMB_KRW", name: "빗썸", exchange: "Bithumb" },
  { id: "COINONE_KRW", name: "코인원", exchange: "Coinone" },
];

const FOREIGN_EXCHANGES = [
  { id: "BINANCE_USDT", name: "바이낸스", exchange: "Binance" },
  { id: "BYBIT_USDT", name: "Bybit", exchange: "Bybit" },
  { id: "OKX_USDT", name: "OKX", exchange: "OKX" },
  { id: "BITGET_USDT", name: "Bitget", exchange: "Bitget" },
  { id: "GATE_USDT", name: "Gate.io", exchange: "Gate" },
  { id: "MEXC_USDT", name: "MEXC", exchange: "MEXC" },
  { id: "HTX_USDT", name: "HTX", exchange: "HTX" },
];

const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function getChosung(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const chosungIndex = Math.floor((code - 0xAC00) / 588);
      result += CHOSUNG[chosungIndex];
    } else {
      result += str[i];
    }
  }
  return result;
}

function matchSearch(item: PremiumData, query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return true;
  
  const symbolMatch = item.symbol.toLowerCase().includes(lowerQuery);
  if (symbolMatch) return true;
  
  const nameMatch = item.name.toLowerCase().includes(lowerQuery);
  if (nameMatch) return true;
  
  const chosung = getChosung(item.name);
  const chosungMatch = chosung.toLowerCase().includes(lowerQuery);
  if (chosungMatch) return true;
  
  return false;
}

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
  refreshInterval = 2000,
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
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const toggleChart = (symbol: string) => {
    setExpandedSymbol(prev => prev === symbol ? null : symbol);
  };

  const getTvSymbol = (symbol: string) => `BINANCE:${symbol}USDT`;

  const fetchData = async () => {
    try {
      const response = await fetch(
        `/api/premium/table?domestic=${domesticExchange}&foreign=${foreignExchange}`
      );

      if (response.status === 429) {
        return;
      }

      if (!response.ok) {
        return;
      }

      const json: ApiResponse = await response.json();

      if (json.success) {
        setData(json.data);
        setAveragePremium(json.averagePremium);
        setFxRate(json.fxRate);
        setUpdatedAt(json.updatedAt);
        setError(null);
      }
    } catch {
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
      result = result.filter((item) => matchSearch(item, searchQuery));
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
  }, [data, searchQuery, sortKey, sortOrder, limit]);

  const formatKRW = (value: number) => {
    if (!value || isNaN(value)) return "-";
    return value.toLocaleString("ko-KR");
  };

  const formatKrwPrice = (value: number) => {
    if (!value || isNaN(value)) return "-";
    if (value >= 1000) {
      return Math.round(value).toLocaleString("ko-KR");
    }
    if (value >= 1) {
      return value.toFixed(1);
    }
    return value.toFixed(1);
  };

  const formatUsdtPrice = (value: number) => {
    if (!value || isNaN(value)) return "-";
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatVolumeKRW = (value: number) => {
    if (!value || isNaN(value)) return "-";
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}조`;
    if (value >= 1e8) return `${(value / 1e8).toFixed(1)}억`;
    if (value >= 1e4) return `${(value / 1e4).toFixed(0)}만`;
    return value.toLocaleString();
  };

  const formatVolumeUsdt = (value: number) => {
    if (!value || isNaN(value)) return "-";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B USDT`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M USDT`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K USDT`;
    return `$${value.toFixed(2)} USDT`;
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
      return <span className="text-gray-600 ml-1 text-xs">↕</span>;
    return sortOrder === "asc" ? (
      <span className="text-blue-400 ml-1 text-xs">↑</span>
    ) : (
      <span className="text-blue-400 ml-1 text-xs">↓</span>
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

  const calcDiff = (current: number, base: number) => {
    if (!current || !base || isNaN(current) || isNaN(base) || base === 0) {
      return { percent: 0, diff: 0, valid: false };
    }
    const percent = ((current - base) / base) * 100;
    const diff = current - base;
    return { percent, diff, valid: true };
  };

  const openCoinMarketCap = (symbol: string) => {
    const cmcUrl = `https://coinmarketcap.com/currencies/${symbol.toLowerCase()}/`;
    window.open(cmcUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">평균 프리미엄</div>
            <div className={`text-xl font-bold ${getPremiumColor(averagePremium)}`}>
              {averagePremium >= 0 ? "+" : ""}{averagePremium.toFixed(2)}%
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">환율 (USDT/KRW)</div>
            <div className="text-xl font-bold text-white">₩{fxRate.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">코인 수</div>
            <div className="text-xl font-bold text-white">{data.length}개</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">업데이트</div>
            <div className="text-lg font-medium text-white">
              {updatedAt ? new Date(updatedAt).toLocaleTimeString("ko-KR") : "--:--:--"}
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={domesticExchange}
            onChange={(e) => setDomesticExchange(e.target.value)}
            className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            {DOMESTIC_EXCHANGES.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          <select
            value={foreignExchange}
            onChange={(e) => setForeignExchange(e.target.value)}
            className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            {FOREIGN_EXCHANGES.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="예: BTC, 비트코인, ㅂㅌ"
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
          {error}
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/80 text-gray-400 text-xs">
                  <th
                    className="px-3 py-2 text-left cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("symbol")}
                  >
                    코인명<SortIcon columnKey="symbol" />
                  </th>
                  <th
                    className="px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("koreanPrice")}
                  >
                    {getDomesticName()}<SortIcon columnKey="koreanPrice" />
                  </th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">
                    {getForeignName()}
                  </th>
                  <th
                    className="px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("premium")}
                  >
                    김프<SortIcon columnKey="premium" />
                  </th>
                  <th
                    className="px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("change24h")}
                  >
                    전일대비<SortIcon columnKey="change24h" />
                  </th>
                  <th
                    className="px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("high24h")}
                  >
                    고가대비(24h)<SortIcon columnKey="high24h" />
                  </th>
                  <th
                    className="px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("low24h")}
                  >
                    저가대비(24h)<SortIcon columnKey="low24h" />
                  </th>
                  <th
                    className="px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("volume24hKrw")}
                  >
                    거래액(일)<SortIcon columnKey="volume24hKrw" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((row, index) => {
                  const prevClose = row.koreanPrice / (1 + row.change24h / 100);
                  const prevDiff = calcDiff(row.koreanPrice, prevClose);
                  const highDiff = calcDiff(row.koreanPrice, row.high24h);
                  const lowDiff = calcDiff(row.koreanPrice, row.low24h);
                  
                  return (
                    <React.Fragment key={row.symbol}>
                    <tr
                      className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                        index % 2 === 0 ? "bg-slate-800/30" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCoinMarketCap(row.symbol)}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors text-left"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {row.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{row.name}</div>
                              <div className="text-gray-500 text-xs">{row.symbol}</div>
                            </div>
                          </button>
                          <button
                            onClick={() => toggleChart(row.symbol)}
                            className={`p-1 transition-colors ${expandedSymbol === row.symbol ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}`}
                            title={expandedSymbol === row.symbol ? "차트 닫기" : "차트 열기"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-white font-medium">₩{formatKRW(row.koreanPrice)}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-white font-medium">₩{formatKrwPrice(row.globalPrice * fxRate)}</div>
                        <div className="text-xs text-gray-500">{formatUsdtPrice(row.globalPrice)} USDT</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className={`font-bold ${getPremiumColor(row.premium)}`}>
                          {row.premium >= 0 ? "+" : ""}{row.premium.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className={getChangeColor(row.change24h)}>
                          {row.change24h >= 0 ? "+" : ""}{row.change24h.toFixed(2)}%
                        </div>
                        {prevDiff.valid && (
                          <div className={`text-xs ${getChangeColor(prevDiff.diff)}`}>
                            {prevDiff.diff >= 0 ? "+" : ""}₩{formatKRW(Math.round(prevDiff.diff))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {highDiff.valid ? (
                          <>
                            <div className={getChangeColor(highDiff.percent)}>
                              {highDiff.percent >= 0 ? "+" : ""}{highDiff.percent.toFixed(2)}%
                            </div>
                            <div className={`text-xs ${getChangeColor(highDiff.diff)}`}>
                              {highDiff.diff >= 0 ? "+" : ""}₩{formatKRW(Math.round(highDiff.diff))}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {lowDiff.valid ? (
                          <>
                            <div className={getChangeColor(lowDiff.percent)}>
                              {lowDiff.percent >= 0 ? "+" : ""}{lowDiff.percent.toFixed(2)}%
                            </div>
                            <div className={`text-xs ${getChangeColor(lowDiff.diff)}`}>
                              {lowDiff.diff >= 0 ? "+" : ""}₩{formatKRW(Math.round(lowDiff.diff))}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-gray-300">₩{formatVolumeKRW(row.volume24hKrw)}</div>
                        <div className="text-xs text-gray-500">{formatVolumeUsdt(row.volume24hUsdt)}</div>
                      </td>
                    </tr>
                    {expandedSymbol === row.symbol && (
                      <tr key={`${row.symbol}-chart`}>
                        <td colSpan={8} className="p-0">
                          <div className="bg-[#0F111A] border-t border-b border-slate-700/50 py-3 px-3">
                            <div className="h-[360px] rounded-xl overflow-hidden bg-slate-900/50">
                              <TradingViewChart
                                tvSymbol={getTvSymbol(row.symbol)}
                                height={360}
                                interval="60"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
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

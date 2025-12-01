import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FOREIGN_EXCHANGES as CONTEXT_FOREIGN_EXCHANGES } from "@/contexts/ExchangeSelectionContext";

const TradingViewChart = dynamic(
  () => import("./charts/TradingViewChart"),
  { ssr: false, loading: () => <div className="h-[360px] bg-slate-900/50 animate-pulse rounded-xl" /> }
);

interface PremiumData {
  symbol: string;
  name: string;
  koreanName: string;
  koreanPrice: number;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  volume24hKrw: number;
  volume24hUsdt: number | null;
  volume24hForeignKrw: number | null;
  change24h: number | null;
  high24h: number;
  low24h: number;
  isListed: boolean;
  cmcSlug?: string;
}

interface ApiResponse {
  success: boolean;
  data: PremiumData[];
  averagePremium: number;
  fxRate: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
  totalCoins: number;
  listedCoins: number;
}

type SortKey = "symbol" | "premium" | "volume24hKrw" | "change24h" | "koreanPrice" | "high24h" | "low24h";
type SortOrder = "asc" | "desc";

interface FlashState {
  [key: string]: {
    price?: "up" | "down";
    premium?: "up" | "down";
  };
}

const DOMESTIC_EXCHANGES = [
  { id: "UPBIT_KRW", name: "업비트", exchange: "Upbit" },
  { id: "BITHUMB_KRW", name: "빗썸", exchange: "Bithumb" },
  { id: "COINONE_KRW", name: "코인원", exchange: "Coinone" },
];

const FOREIGN_EXCHANGES = CONTEXT_FOREIGN_EXCHANGES.map(ex => ({
  id: ex.value,
  name: ex.label,
  shortName: ex.shortName,
  exchange: ex.exchange,
  logo: ex.logo,
}));

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
  
  if (item.symbol.toLowerCase().includes(lowerQuery)) return true;
  if (item.name.toLowerCase().includes(lowerQuery)) return true;
  if (item.koreanName.toLowerCase().includes(lowerQuery)) return true;
  
  const chosung = getChosung(item.koreanName);
  if (chosung.toLowerCase().includes(lowerQuery)) return true;
  
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
  const [totalCoins, setTotalCoins] = useState(0);
  const [listedCoins, setListedCoins] = useState(0);

  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("OKX_USDT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("premium");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [flashStates, setFlashStates] = useState<FlashState>({});
  const prevDataRef = useRef<Record<string, { price: number; premium: number | null }>>({});

  const toggleChart = (symbol: string) => {
    setExpandedSymbol(prev => prev === symbol ? null : symbol);
  };

  const getTvSymbol = (symbol: string) => `BINANCE:${symbol}USDT`;

  const detectChanges = useCallback((newData: PremiumData[]) => {
    const newFlashStates: FlashState = {};
    const newPrevData: Record<string, { price: number; premium: number | null }> = {};

    newData.forEach(item => {
      const prev = prevDataRef.current[item.symbol];
      newPrevData[item.symbol] = { price: item.koreanPrice, premium: item.premium };

      if (prev) {
        const priceDiff = Math.abs(item.koreanPrice - prev.price);
        const priceThreshold = prev.price * 0.0001;
        if (priceDiff > priceThreshold && priceDiff > 0) {
          newFlashStates[item.symbol] = {
            ...newFlashStates[item.symbol],
            price: item.koreanPrice > prev.price ? "up" : "down"
          };
        }
        if (item.premium !== null && prev.premium !== null && Math.abs(item.premium - prev.premium) > 0.01) {
          newFlashStates[item.symbol] = {
            ...newFlashStates[item.symbol],
            premium: item.premium > prev.premium ? "up" : "down"
          };
        }
      }
    });

    prevDataRef.current = newPrevData;

    if (Object.keys(newFlashStates).length > 0) {
      setFlashStates(newFlashStates);
      setTimeout(() => setFlashStates({}), 600);
    }
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `/api/premium/table?domestic=${domesticExchange}&foreign=${foreignExchange}`
      );

      if (response.status === 429) return;
      if (!response.ok) return;

      const json: ApiResponse = await response.json();

      if (json.success) {
        detectChanges(json.data);
        setData(json.data);
        setAveragePremium(json.averagePremium);
        setFxRate(json.fxRate);
        setUpdatedAt(json.updatedAt);
        setTotalCoins(json.totalCoins);
        setListedCoins(json.listedCoins);
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
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      if (aVal === null) aVal = sortOrder === "asc" ? Infinity : -Infinity;
      if (bVal === null) bVal = sortOrder === "asc" ? Infinity : -Infinity;

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

  const formatKRW = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return value.toLocaleString("ko-KR");
  };

  const formatKrwPrice = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    if (value >= 1000) {
      return Math.round(value).toLocaleString("ko-KR");
    }
    if (value >= 1) {
      return value.toFixed(1);
    }
    return value.toFixed(4);
  };

  const formatUsdtPrice = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(4)}`;
  };

  const formatVolumeKRW = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return "-";
    
    if (value >= 1e12) {
      const jo = Math.floor(value / 1e12);
      const eok = Math.floor((value % 1e12) / 1e8);
      if (eok > 0) {
        return `${jo}조 ${eok}억`;
      }
      return `${jo}조`;
    }
    if (value >= 1e8) {
      return `${Math.floor(value / 1e8)}억`;
    }
    if (value >= 1e4) {
      return `${Math.floor(value / 1e4)}만`;
    }
    return Math.round(value).toLocaleString();
  };

  const formatVolumeUsdt = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return "-";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getPremiumColor = (premium: number | null) => {
    if (premium === null) return "text-gray-500";
    if (premium >= 5) return "text-red-400";
    if (premium >= 3) return "text-orange-400";
    if (premium >= 1) return "text-yellow-400";
    if (premium >= 0) return "text-green-400";
    return "text-blue-400";
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-gray-500";
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getFlashClass = (symbol: string, field: "price" | "premium") => {
    const flash = flashStates[symbol]?.[field];
    if (!flash) return "";
    return flash === "up" 
      ? "animate-flash-green" 
      : "animate-flash-red";
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
    return exchange ? exchange.shortName : "해외";
  };

  const calcDiff = (current: number, base: number) => {
    if (!current || !base || isNaN(current) || isNaN(base) || base === 0) {
      return { percent: 0, diff: 0, valid: false };
    }
    const percent = ((current - base) / base) * 100;
    const diff = current - base;
    return { percent, diff, valid: true };
  };

  const openCoinMarketCap = (symbol: string, cmcSlug?: string) => {
    const slug = cmcSlug || symbol.toLowerCase();
    const cmcUrl = `https://coinmarketcap.com/currencies/${slug}/`;
    window.open(cmcUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">평균 김프</div>
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
            <div className="text-xl font-bold text-white">
              {listedCoins}<span className="text-sm text-gray-400">/{totalCoins}개</span>
            </div>
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
                  const prevClose = row.change24h !== null 
                    ? row.koreanPrice / (1 + row.change24h / 100)
                    : row.koreanPrice;
                  const prevDiff = row.change24h !== null 
                    ? calcDiff(row.koreanPrice, prevClose) 
                    : { percent: 0, diff: 0, valid: false };
                  const highDiff = calcDiff(row.koreanPrice, row.high24h);
                  const lowDiff = calcDiff(row.koreanPrice, row.low24h);
                  
                  return (
                    <React.Fragment key={row.symbol}>
                    <tr
                      className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                        index % 2 === 0 ? "bg-slate-800/30" : ""
                      } ${!row.isListed ? "opacity-60" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCoinMarketCap(row.symbol, row.cmcSlug)}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors text-left"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {row.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{row.koreanName}</div>
                              <div className="text-gray-500 text-xs">{row.symbol}</div>
                            </div>
                          </button>
                          {row.isListed && (
                            <button
                              onClick={() => toggleChart(row.symbol)}
                              className={`p-1 transition-colors ${expandedSymbol === row.symbol ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}`}
                              title={expandedSymbol === row.symbol ? "차트 닫기" : "차트 열기"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                            </button>
                          )}
                          {!row.isListed && (
                            <span className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">미상장</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-2 text-right ${getFlashClass(row.symbol, "price")}`}>
                        <div className="text-white font-medium">₩{formatKRW(row.koreanPrice)}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.isListed && row.globalPriceKrw !== null ? (
                          <>
                            <div className="text-white font-medium">₩{formatKrwPrice(row.globalPriceKrw)}</div>
                            <div className="text-xs text-gray-500">{formatUsdtPrice(row.globalPrice)} USDT</div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-right ${getFlashClass(row.symbol, "premium")}`}>
                        {row.premium !== null ? (
                          <div className={`font-bold ${getPremiumColor(row.premium)}`}>
                            {row.premium >= 0 ? "+" : ""}{row.premium.toFixed(2)}%
                          </div>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.change24h !== null ? (
                          <>
                            <div className={getChangeColor(row.change24h)}>
                              {row.change24h >= 0 ? "+" : ""}{row.change24h.toFixed(2)}%
                            </div>
                            {prevDiff.valid && (
                              <div className={`text-xs ${getChangeColor(prevDiff.diff)}`}>
                                {prevDiff.diff >= 0 ? "+" : ""}₩{formatKRW(Math.round(prevDiff.diff))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
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
                        <div className="flex flex-col items-end leading-tight">
                          <span className="text-gray-300">
                            ₩{formatVolumeKRW(row.volume24hKrw)}
                            <span className="ml-1 text-xs text-gray-500">(국내)</span>
                          </span>
                          {row.isListed && row.volume24hForeignKrw !== null ? (
                            <>
                              <span className="text-gray-300">
                                ₩{formatVolumeKRW(row.volume24hForeignKrw)}
                                <span className="ml-1 text-xs text-gray-500">(해외)</span>
                              </span>
                              <span className="mt-0.5 text-[11px] text-gray-500">
                                {formatVolumeUsdt(row.volume24hUsdt)} USDT
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">해외: -</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedSymbol === row.symbol && row.isListed && (
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
        </div>
      )}
    </div>
  );
}

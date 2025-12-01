import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FOREIGN_EXCHANGES as CONTEXT_FOREIGN_EXCHANGES, EXCHANGE_LOGOS } from "@/contexts/ExchangeSelectionContext";

interface DropdownOption {
  id: string;
  name: string;
  shortName?: string;
  logo: string;
}

function MiniDropdown({ 
  value, 
  options, 
  onChange, 
  showShortName = false 
}: { 
  value: string; 
  options: DropdownOption[]; 
  onChange: (value: string) => void;
  showShortName?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(o => o.id === value);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-600 hover:border-slate-500 transition-colors"
      >
        {selectedOption && (
          <img src={selectedOption.logo} alt="" className="w-4 h-4 rounded" />
        )}
        <span className="text-white text-sm truncate max-w-[80px]">
          {showShortName ? selectedOption?.shortName || selectedOption?.name : selectedOption?.name?.replace('🇰🇷 ', '')}
        </span>
        <svg 
          className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          <div>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 transition-colors text-left ${
                  value === option.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <img src={option.logo} alt="" className="w-4 h-4 rounded flex-shrink-0" />
                <span className="text-white text-sm whitespace-nowrap">
                  {option.name?.replace('🇰🇷 ', '')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  { id: "UPBIT_KRW", name: "🇰🇷 업비트 KRW", exchange: "Upbit", logo: EXCHANGE_LOGOS.UPBIT },
  { id: "UPBIT_BTC", name: "🇰🇷 업비트 BTC", exchange: "Upbit", logo: EXCHANGE_LOGOS.UPBIT },
  { id: "UPBIT_USDT", name: "🇰🇷 업비트 USDT", exchange: "Upbit", logo: EXCHANGE_LOGOS.UPBIT },
  { id: "BITHUMB_KRW", name: "🇰🇷 빗썸 KRW", exchange: "Bithumb", logo: EXCHANGE_LOGOS.BITHUMB },
  { id: "BITHUMB_BTC", name: "🇰🇷 빗썸 BTC", exchange: "Bithumb", logo: EXCHANGE_LOGOS.BITHUMB },
  { id: "BITHUMB_USDT", name: "🇰🇷 빗썸 USDT", exchange: "Bithumb", logo: EXCHANGE_LOGOS.BITHUMB },
  { id: "COINONE_KRW", name: "🇰🇷 코인원 KRW", exchange: "Coinone", logo: EXCHANGE_LOGOS.COINONE },
];

const FOREIGN_EXCHANGES = CONTEXT_FOREIGN_EXCHANGES.map(ex => ({
  id: ex.value,
  name: ex.label,
  shortName: ex.shortName,
  exchange: ex.exchange,
  logo: ex.logo,
}));

const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const COINGECKO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'XRP': 'ripple', 'SOL': 'solana',
  'DOGE': 'dogecoin', 'ADA': 'cardano', 'AVAX': 'avalanche-2', 'SHIB': 'shiba-inu',
  'DOT': 'polkadot', 'LINK': 'chainlink', 'TRX': 'tron', 'MATIC': 'matic-network',
  'UNI': 'uniswap', 'ATOM': 'cosmos', 'LTC': 'litecoin', 'ETC': 'ethereum-classic',
  'XLM': 'stellar', 'BCH': 'bitcoin-cash', 'NEAR': 'near', 'APT': 'aptos',
  'FIL': 'filecoin', 'ICP': 'internet-computer', 'HBAR': 'hedera-hashgraph',
  'VET': 'vechain', 'ARB': 'arbitrum', 'OP': 'optimism', 'SAND': 'the-sandbox',
  'MANA': 'decentraland', 'AAVE': 'aave', 'GRT': 'the-graph', 'AXS': 'axie-infinity',
  'ALGO': 'algorand', 'EOS': 'eos', 'XTZ': 'tezos', 'FLOW': 'flow',
  'THETA': 'theta-token', 'KLAY': 'klaytn', 'IMX': 'immutable-x', 'SUI': 'sui',
  'SEI': 'sei-network', 'TON': 'the-open-network', 'PEPE': 'pepe', 'BONK': 'bonk',
  'WIF': 'dogwifcoin', 'FLOKI': 'floki', 'CAKE': 'pancakeswap-token',
};

function CoinIcon({ symbol }: { symbol: string }) {
  const [cdnIndex, setCdnIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);
  const lowerSymbol = symbol.toLowerCase();
  const upperSymbol = symbol.toUpperCase();
  
  const gradientColors: Record<string, string> = {
    'BTC': 'from-orange-500 to-yellow-500',
    'ETH': 'from-indigo-500 to-purple-500',
    'XRP': 'from-gray-400 to-blue-500',
    'SOL': 'from-purple-500 to-green-400',
    'DOGE': 'from-yellow-400 to-amber-500',
    'ADA': 'from-blue-600 to-cyan-400',
    'USDT': 'from-green-500 to-emerald-600',
    'USDC': 'from-blue-400 to-blue-600',
    'SHIB': 'from-red-500 to-orange-500',
    'AVAX': 'from-red-600 to-pink-500',
    'DOT': 'from-pink-500 to-purple-600',
    'LINK': 'from-blue-500 to-indigo-600',
    'MATIC': 'from-purple-600 to-violet-500',
    'TRX': 'from-red-500 to-red-700',
    'TON': 'from-blue-400 to-sky-500',
    'PEPE': 'from-green-400 to-green-600',
  };
  
  const gradient = gradientColors[upperSymbol] || 'from-slate-500 to-slate-600';

  const coingeckoId = COINGECKO_ID_MAP[upperSymbol];
  const cdnUrls = [
    `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${lowerSymbol}.png`,
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${lowerSymbol}.png`,
    coingeckoId ? `https://cdn.jsdelivr.net/gh/AleneMcCullworking/crypto-icons@main/icons/${coingeckoId}.png` : null,
    `https://static.coincap.io/assets/icons/${lowerSymbol}@2x.png`,
  ].filter(Boolean) as string[];

  const handleError = () => {
    if (cdnIndex < cdnUrls.length - 1) {
      setCdnIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
        {symbol.charAt(0)}
      </div>
    );
  }
  
  return (
    <img
      src={cdnUrls[cdnIndex]}
      alt={symbol}
      className="w-6 h-6 rounded-full flex-shrink-0"
      onError={handleError}
      loading="lazy"
    />
  );
}

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
  refreshInterval = 1000,
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
  const [sortKey, setSortKey] = useState<SortKey>("volume24hKrw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };
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
    if (value >= 100) {
      return value.toFixed(1);
    }
    if (value >= 1) {
      return value.toFixed(2);
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
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-xs hidden md:inline">기준</span>
            <MiniDropdown
              value={domesticExchange}
              options={DOMESTIC_EXCHANGES}
              onChange={setDomesticExchange}
            />
          </div>

          <span className="text-gray-500">↔</span>

          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-xs hidden md:inline">해외</span>
            <MiniDropdown
              value={foreignExchange}
              options={FOREIGN_EXCHANGES}
              onChange={setForeignExchange}
              showShortName={true}
            />
          </div>

          <div className="hidden md:flex items-center text-gray-400 text-xs px-2">
            <span>암호화폐 <span className="text-white font-medium">{totalCoins}</span>개</span>
          </div>

          <div className="flex-1 min-w-[120px] md:min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색: BTC, ㅂㅌ"
              className="w-full bg-slate-700 text-white rounded-lg px-2 md:px-3 py-1.5 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
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
                <tr className="bg-slate-900/80 text-gray-400 text-[10px] md:text-xs">
                  <th
                    className="px-1 md:px-3 py-1.5 md:py-2 text-left cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("symbol")}
                  >
                    <span className="hidden md:inline">코인명</span>
                    <span className="md:hidden">코인</span>
                    <SortIcon columnKey="symbol" />
                  </th>
                  <th
                    className="px-1 md:px-3 py-1.5 md:py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("koreanPrice")}
                  >
                    <span className="hidden md:inline">{getDomesticName()}</span>
                    <span className="md:hidden">현재가</span>
                    <SortIcon columnKey="koreanPrice" />
                  </th>
                  <th className="hidden md:table-cell px-3 py-2 text-right whitespace-nowrap">
                    {getForeignName()}
                  </th>
                  <th
                    className="px-1 md:px-3 py-1.5 md:py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("premium")}
                  >
                    김프<SortIcon columnKey="premium" />
                  </th>
                  <th
                    className="px-1 md:px-3 py-1.5 md:py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("change24h")}
                  >
                    <span className="hidden md:inline">전일대비</span>
                    <span className="md:hidden">24h</span>
                    <SortIcon columnKey="change24h" />
                  </th>
                  <th
                    className="hidden lg:table-cell px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("high24h")}
                  >
                    고가대비(24h)<SortIcon columnKey="high24h" />
                  </th>
                  <th
                    className="hidden lg:table-cell px-3 py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("low24h")}
                  >
                    저가대비(24h)<SortIcon columnKey="low24h" />
                  </th>
                  <th
                    className="px-1 md:px-3 py-1.5 md:py-2 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("volume24hKrw")}
                  >
                    <span className="hidden md:inline">거래액(일)</span>
                    <span className="md:hidden">거래액</span>
                    <SortIcon columnKey="volume24hKrw" />
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
                      }`}
                    >
                      <td className="px-1 md:px-3 py-1.5 md:py-2">
                        <div className="flex items-center gap-1 md:gap-2">
                          <button
                            onClick={() => toggleFavorite(row.symbol)}
                            className={`text-sm md:text-lg transition-colors flex-shrink-0 ${favorites.has(row.symbol) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                            title={favorites.has(row.symbol) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          >
                            {favorites.has(row.symbol) ? '★' : '☆'}
                          </button>
                          <div className="hidden md:block">
                            <CoinIcon symbol={row.symbol} />
                          </div>
                          <button
                            onClick={() => openCoinMarketCap(row.symbol, row.cmcSlug)}
                            className="flex flex-col hover:text-blue-400 transition-colors text-left min-w-0"
                          >
                            <div className="text-white font-medium text-xs md:text-sm truncate">{row.koreanName}</div>
                            <div className="text-gray-500 text-[10px] md:text-xs">{row.symbol}</div>
                          </button>
                          <button
                            onClick={() => toggleChart(row.symbol)}
                            className={`p-0.5 md:p-1 transition-colors flex-shrink-0 ${expandedSymbol === row.symbol ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}`}
                            title={expandedSymbol === row.symbol ? "차트 닫기" : "차트 열기"}
                          >
                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          </button>
                          {!row.isListed && (
                            <span className="text-[8px] md:text-xs text-orange-400 bg-orange-400/20 px-1 py-0.5 rounded flex-shrink-0">미상장</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-1 md:px-3 py-2 text-right ${getFlashClass(row.symbol, "price")}`}>
                        <div className="text-white font-medium text-xs md:text-sm">₩{formatKrwPrice(row.koreanPrice)}</div>
                        <div className="md:hidden text-[10px] text-gray-500">
                          {row.globalPriceKrw !== null && row.globalPrice !== null ? (
                            <span>₩{formatKrwPrice(row.globalPriceKrw)} / ${formatUsdtPrice(row.globalPrice)}</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 text-right">
                        {row.isListed && row.globalPriceKrw !== null ? (
                          <>
                            <div className="text-white font-medium">₩{formatKrwPrice(row.globalPriceKrw)}</div>
                            <div className="text-xs text-gray-500">{formatUsdtPrice(row.globalPrice)} USDT</div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </td>
                      <td className={`px-1 md:px-3 py-1.5 md:py-2 text-right ${getFlashClass(row.symbol, "premium")}`}>
                        {row.premium !== null ? (
                          <div className={`font-bold text-xs md:text-sm ${getPremiumColor(row.premium)}`}>
                            {row.premium >= 0 ? "+" : ""}{row.premium.toFixed(2)}%
                          </div>
                        ) : (
                          <div className="text-gray-500 text-xs">-</div>
                        )}
                      </td>
                      <td className="px-1 md:px-3 py-1.5 md:py-2 text-right">
                        {row.change24h !== null ? (
                          <>
                            <div className={`text-xs md:text-sm ${getChangeColor(row.change24h)}`}>
                              {row.change24h >= 0 ? "+" : ""}{row.change24h.toFixed(2)}%
                            </div>
                            <div className={`hidden md:block text-xs ${getChangeColor(prevDiff.diff)}`}>
                              {prevDiff.valid && (
                                <span>{prevDiff.diff >= 0 ? "+" : ""}₩{formatKRW(Math.round(prevDiff.diff))}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 text-xs">-</div>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-2 text-right">
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
                      <td className="hidden lg:table-cell px-3 py-2 text-right">
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
                      <td className="px-1 md:px-3 py-1.5 md:py-2 text-right">
                        <div className="flex flex-col items-end leading-tight">
                          <span className="text-gray-300 text-[10px] md:text-sm">
                            ₩{formatVolumeKRW(row.volume24hKrw)}
                            <span className="hidden md:inline ml-1 text-xs text-gray-500">(국내)</span>
                          </span>
                          <span className="hidden md:inline">
                            {row.isListed && row.volume24hForeignKrw !== null ? (
                              <>
                                <span className="text-gray-300">
                                  ₩{formatVolumeKRW(row.volume24hForeignKrw)}
                                  <span className="ml-1 text-xs text-gray-500">(해외)</span>
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-500 text-xs">해외: -</span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedSymbol === row.symbol && (
                      <tr key={`${row.symbol}-chart`}>
                        <td colSpan={8} className="p-0 lg:table-cell">
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

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

export interface DomesticExchange {
  exchange: "UPBIT" | "BITHUMB" | "COINONE";
  quote: "KRW" | "BTC" | "USDT";
}

export interface ForeignExchange {
  exchange: "BINANCE" | "BINANCE_FUTURES" | "OKX" | "BYBIT" | "BITGET" | "GATE" | "HTX" | "MEXC";
  quote: "USDT" | "BTC" | "USD";
}

export const EXCHANGE_LOGOS: Record<string, string> = {
  UPBIT: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/351.png",
  BITHUMB: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/200.png",
  COINONE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230052FF'/%3E%3Cpath d='M32 10c12.15 0 22 9.85 22 22s-9.85 22-22 22c-9.39 0-17.4-5.88-20.56-14.16-.5-1.31.67-2.64 2.06-2.34 1.02.22 1.72 1.12 1.94 2.14C17.89 47.5 24.42 52 32 52c11.05 0 20-8.95 20-20s-8.95-20-20-20c-7.58 0-14.11 4.5-17.06 11.36-.22 1.02-.92 1.92-1.94 2.14-1.39.3-2.56-1.03-2.06-2.34C14.6 15.88 22.61 10 32 10z' fill='white'/%3E%3Ccircle cx='32' cy='32' r='6' fill='white'/%3E%3C/svg%3E",
  BINANCE: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
  BINANCE_FUTURES: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
  OKX: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='black'/%3E%3Cg fill='white'%3E%3Crect x='12' y='12' width='12' height='12' rx='2'/%3E%3Crect x='26' y='26' width='12' height='12' rx='2'/%3E%3Crect x='40' y='12' width='12' height='12' rx='2'/%3E%3Crect x='12' y='40' width='12' height='12' rx='2'/%3E%3Crect x='40' y='40' width='12' height='12' rx='2'/%3E%3C/g%3E%3C/svg%3E",
  BYBIT: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='black'/%3E%3Cpath d='M16 16h10v32H16V16zm22 0h10v20l-10 12V16z' fill='%23F7A600'/%3E%3C/svg%3E",
  BITGET: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/513.png",
  GATE: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/302.png",
  HTX: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/102.png",
  MEXC: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/544.png",
};

export const DOMESTIC_EXCHANGES: { value: string; label: string; exchange: DomesticExchange["exchange"]; quote: DomesticExchange["quote"]; logo: string }[] = [
  { value: "UPBIT_KRW", label: "🇰🇷 업비트 KRW", exchange: "UPBIT", quote: "KRW", logo: EXCHANGE_LOGOS.UPBIT },
  { value: "UPBIT_BTC", label: "🇰🇷 업비트 BTC", exchange: "UPBIT", quote: "BTC", logo: EXCHANGE_LOGOS.UPBIT },
  { value: "UPBIT_USDT", label: "🇰🇷 업비트 USDT", exchange: "UPBIT", quote: "USDT", logo: EXCHANGE_LOGOS.UPBIT },
  { value: "BITHUMB_KRW", label: "🇰🇷 빗썸 KRW", exchange: "BITHUMB", quote: "KRW", logo: EXCHANGE_LOGOS.BITHUMB },
  { value: "BITHUMB_BTC", label: "🇰🇷 빗썸 BTC", exchange: "BITHUMB", quote: "BTC", logo: EXCHANGE_LOGOS.BITHUMB },
  { value: "BITHUMB_USDT", label: "🇰🇷 빗썸 USDT", exchange: "BITHUMB", quote: "USDT", logo: EXCHANGE_LOGOS.BITHUMB },
  { value: "COINONE_KRW", label: "🇰🇷 코인원 KRW", exchange: "COINONE", quote: "KRW", logo: EXCHANGE_LOGOS.COINONE },
];

export const FOREIGN_EXCHANGES: { value: string; label: string; shortName: string; exchange: ForeignExchange["exchange"]; quote: ForeignExchange["quote"]; logo: string }[] = [
  { value: "BINANCE_USDT", label: "바이낸스 USDT 마켓", shortName: "바이낸스", exchange: "BINANCE", quote: "USDT", logo: EXCHANGE_LOGOS.BINANCE },
  { value: "BINANCE_BTC", label: "바이낸스 BTC 마켓", shortName: "바이낸스", exchange: "BINANCE", quote: "BTC", logo: EXCHANGE_LOGOS.BINANCE },
  { value: "BINANCE_FUTURES", label: "바이낸스 선물 USDS-M 마켓", shortName: "바이낸스 선물", exchange: "BINANCE_FUTURES", quote: "USD", logo: EXCHANGE_LOGOS.BINANCE_FUTURES },
  { value: "OKX_USDT", label: "OKX USDT 마켓", shortName: "OKX", exchange: "OKX", quote: "USDT", logo: EXCHANGE_LOGOS.OKX },
  { value: "BYBIT_USDT", label: "Bybit USDT 마켓", shortName: "Bybit", exchange: "BYBIT", quote: "USDT", logo: EXCHANGE_LOGOS.BYBIT },
  { value: "BITGET_USDT", label: "Bitget USDT 마켓", shortName: "Bitget", exchange: "BITGET", quote: "USDT", logo: EXCHANGE_LOGOS.BITGET },
  { value: "GATE_USDT", label: "Gate.io USDT 마켓", shortName: "Gate.io", exchange: "GATE", quote: "USDT", logo: EXCHANGE_LOGOS.GATE },
  { value: "HTX_USDT", label: "HTX USDT 마켓", shortName: "HTX", exchange: "HTX", quote: "USDT", logo: EXCHANGE_LOGOS.HTX },
  { value: "MEXC_USDT", label: "MEXC USDT 마켓", shortName: "MEXC", exchange: "MEXC", quote: "USDT", logo: EXCHANGE_LOGOS.MEXC },
];

interface ExchangeSelectionContextType {
  domesticExchange: string;
  foreignExchange: string;
  setDomesticExchange: (value: string) => void;
  setForeignExchange: (value: string) => void;
  getDomesticExchangeInfo: () => DomesticExchange;
  getForeignExchangeInfo: () => ForeignExchange;
  getTradingViewDomesticSymbol: (baseSymbol: string) => string;
  getTradingViewForeignSymbol: (baseSymbol: string) => string;
}

const ExchangeSelectionContext = createContext<ExchangeSelectionContextType | undefined>(undefined);

export function ExchangeSelectionProvider({ children }: { children: ReactNode }) {
  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("OKX_USDT");

  const getDomesticExchangeInfo = (): DomesticExchange => {
    const found = DOMESTIC_EXCHANGES.find((e) => e.value === domesticExchange);
    return found ? { exchange: found.exchange, quote: found.quote } : { exchange: "UPBIT", quote: "KRW" };
  };

  const getForeignExchangeInfo = (): ForeignExchange => {
    const found = FOREIGN_EXCHANGES.find((e) => e.value === foreignExchange);
    return found ? { exchange: found.exchange, quote: found.quote } : { exchange: "OKX", quote: "USDT" };
  };

  const getTradingViewDomesticSymbol = (baseSymbol: string): string => {
    const info = getDomesticExchangeInfo();
    const exchangeMap: Record<string, string> = {
      UPBIT: "UPBIT",
      BITHUMB: "BITHUMB",
      COINONE: "COINONE",
    };
    const tvExchange = exchangeMap[info.exchange] || "UPBIT";
    return `${tvExchange}:${baseSymbol}${info.quote}`;
  };

  const getTradingViewForeignSymbol = (baseSymbol: string): string => {
    const info = getForeignExchangeInfo();
    const exchangeMap: Record<string, string> = {
      BINANCE: "BINANCE",
      BINANCE_FUTURES: "BINANCE",
      OKX: "OKX",
      BYBIT: "BYBIT",
      BITGET: "BITGET",
      GATE: "GATEIO",
      HTX: "HTX",
      MEXC: "MEXC",
    };
    const tvExchange = exchangeMap[info.exchange] || "BINANCE";
    if (info.exchange === "BINANCE_FUTURES") {
      return `${tvExchange}:${baseSymbol}USDT.P`;
    }
    return `${tvExchange}:${baseSymbol}${info.quote}`;
  };

  const value = useMemo(
    () => ({
      domesticExchange,
      foreignExchange,
      setDomesticExchange,
      setForeignExchange,
      getDomesticExchangeInfo,
      getForeignExchangeInfo,
      getTradingViewDomesticSymbol,
      getTradingViewForeignSymbol,
    }),
    [domesticExchange, foreignExchange]
  );

  return (
    <ExchangeSelectionContext.Provider value={value}>
      {children}
    </ExchangeSelectionContext.Provider>
  );
}

export function useExchangeSelection() {
  const context = useContext(ExchangeSelectionContext);
  if (context === undefined) {
    throw new Error("useExchangeSelection must be used within an ExchangeSelectionProvider");
  }
  return context;
}

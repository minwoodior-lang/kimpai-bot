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
  UPBIT: "/exchanges/upbit.svg",
  BITHUMB: "/exchanges/bithumb.svg",
  COINONE: "/exchanges/coinone.svg",
  BINANCE: "/exchanges/binance.svg",
  BINANCE_FUTURES: "/exchanges/binance.svg",
  OKX: "/exchanges/okx.svg",
  BYBIT: "/exchanges/bybit.svg",
  BITGET: "/exchanges/bitget.svg",
  GATE: "/exchanges/gate.svg",
  HTX: "/exchanges/htx.svg",
  MEXC: "/exchanges/mexc.svg",
};

export const DOMESTIC_EXCHANGES: { value: string; label: string; exchange: DomesticExchange["exchange"]; quote: DomesticExchange["quote"]; logo: string }[] = [
  { value: "UPBIT_KRW", label: "업비트 KRW", exchange: "UPBIT", quote: "KRW", logo: "/exchanges/upbit.svg" },
  { value: "UPBIT_BTC", label: "업비트 BTC", exchange: "UPBIT", quote: "BTC", logo: "/exchanges/upbit.svg" },
  { value: "UPBIT_USDT", label: "업비트 USDT", exchange: "UPBIT", quote: "USDT", logo: "/exchanges/upbit.svg" },
  { value: "BITHUMB_KRW", label: "빗썸 KRW", exchange: "BITHUMB", quote: "KRW", logo: "/exchanges/bithumb.svg" },
  { value: "BITHUMB_BTC", label: "빗썸 BTC", exchange: "BITHUMB", quote: "BTC", logo: "/exchanges/bithumb.svg" },
  { value: "BITHUMB_USDT", label: "빗썸 USDT", exchange: "BITHUMB", quote: "USDT", logo: "/exchanges/bithumb.svg" },
  { value: "COINONE_KRW", label: "코인원 KRW", exchange: "COINONE", quote: "KRW", logo: "/exchanges/coinone.svg" },
];

export const FOREIGN_EXCHANGES: { value: string; label: string; shortName: string; exchange: ForeignExchange["exchange"]; quote: ForeignExchange["quote"]; logo: string }[] = [
  { value: "BINANCE_USDT", label: "바이낸스 USDT 마켓", shortName: "바이낸스", exchange: "BINANCE", quote: "USDT", logo: "/exchanges/binance.svg" },
  { value: "BINANCE_BTC", label: "바이낸스 BTC 마켓", shortName: "바이낸스", exchange: "BINANCE", quote: "BTC", logo: "/exchanges/binance.svg" },
  { value: "BINANCE_FUTURES", label: "바이낸스 선물 USDS-M 마켓", shortName: "바이낸스 선물", exchange: "BINANCE_FUTURES", quote: "USD", logo: "/exchanges/binance.svg" },
  { value: "OKX_USDT", label: "OKX USDT 마켓", shortName: "OKX", exchange: "OKX", quote: "USDT", logo: "/exchanges/okx.svg" },
  { value: "BYBIT_USDT", label: "Bybit USDT 마켓", shortName: "Bybit", exchange: "BYBIT", quote: "USDT", logo: "/exchanges/bybit.svg" },
  { value: "BITGET_USDT", label: "Bitget USDT 마켓", shortName: "Bitget", exchange: "BITGET", quote: "USDT", logo: "/exchanges/bitget.svg" },
  { value: "GATE_USDT", label: "Gate.io USDT 마켓", shortName: "Gate.io", exchange: "GATE", quote: "USDT", logo: "/exchanges/gate.svg" },
  { value: "HTX_USDT", label: "HTX USDT 마켓", shortName: "HTX", exchange: "HTX", quote: "USDT", logo: "/exchanges/htx.svg" },
  { value: "MEXC_USDT", label: "MEXC USDT 마켓", shortName: "MEXC", exchange: "MEXC", quote: "USDT", logo: "/exchanges/mexc.svg" },
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

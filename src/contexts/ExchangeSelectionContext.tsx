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
  COINONE: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/174.png",
  BINANCE: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
  BINANCE_FUTURES: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
  OKX: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png",
  BYBIT: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png",
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
  { value: "BINANCE_USDT", label: "바이낸스 USDT 마켓", shortName: "바이낸스 USDT", exchange: "BINANCE", quote: "USDT", logo: EXCHANGE_LOGOS.BINANCE },
  { value: "BINANCE_FUTURES", label: "바이낸스 선물 (USDⓈ-M)", shortName: "바이낸스 선물", exchange: "BINANCE_FUTURES", quote: "USD", logo: EXCHANGE_LOGOS.BINANCE_FUTURES },
  { value: "OKX_USDT", label: "OKX USDT 마켓", shortName: "OKX USDT", exchange: "OKX", quote: "USDT", logo: EXCHANGE_LOGOS.OKX },
  { value: "BYBIT_USDT", label: "Bybit USDT 마켓", shortName: "Bybit USDT", exchange: "BYBIT", quote: "USDT", logo: EXCHANGE_LOGOS.BYBIT },
  { value: "BITGET_USDT", label: "Bitget USDT 마켓", shortName: "Bitget USDT", exchange: "BITGET", quote: "USDT", logo: EXCHANGE_LOGOS.BITGET },
  { value: "GATE_USDT", label: "Gate USDT 마켓", shortName: "Gate USDT", exchange: "GATE", quote: "USDT", logo: EXCHANGE_LOGOS.GATE },
  { value: "HTX_USDT", label: "HTX USDT 마켓", shortName: "HTX USDT", exchange: "HTX", quote: "USDT", logo: EXCHANGE_LOGOS.HTX },
  { value: "MEXC_USDT", label: "MEXC USDT 마켓", shortName: "MEXC USDT", exchange: "MEXC", quote: "USDT", logo: EXCHANGE_LOGOS.MEXC },
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
  const [foreignExchange, setForeignExchange] = useState("BINANCE_USDT");

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

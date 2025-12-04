export interface PriceEntry {
  price: number;
  ts: number;
}

export interface PriceMap {
  [key: string]: PriceEntry;
}

export interface MarketInfo {
  id: string;
  exchange: string;
  market: string;
  base: string;
  quote: string;
  name_ko?: string;
  name_en?: string;
  isDomestic?: boolean;
}

export interface FetcherResult {
  prices: PriceMap;
  errors: string[];
}

export interface MarketStatsEntry {
  change24hRate: number;
  change24hAbs: number;
  high24h: number | null;
  low24h: number | null;
  volume24hQuote: number;
}

export type MarketStatsMap = Record<string, MarketStatsEntry>;

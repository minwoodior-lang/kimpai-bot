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

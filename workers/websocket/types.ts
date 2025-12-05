export interface WebSocketPrice {
  exchange: string;
  symbol: string;
  quote: string;
  price: number;
  timestamp: number;
  change24hRate?: number;
  volume24hQuote?: number;
  high24h?: number;
  low24h?: number;
}

export interface ExchangeWebSocketConfig {
  name: string;
  url: string;
  reconnectInterval: number;
  pingInterval: number;
  subscribeMessage?: (symbols: string[]) => any;
}

export type PriceUpdateCallback = (price: WebSocketPrice) => void;

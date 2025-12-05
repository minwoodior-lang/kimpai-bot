import { WebSocketPrice, PriceUpdateCallback } from './types';
import { startBinanceSpotWebSocket, stopBinanceSpotWebSocket, updateBinanceSpotSymbols, isBinanceWsAvailable } from './exchanges/binanceSpot';
import { startBinanceFuturesWebSocket, stopBinanceFuturesWebSocket, updateBinanceFuturesSymbols, isBinanceFuturesWsAvailable } from './exchanges/binanceFutures';
import { startOkxWebSocket, stopOkxWebSocket, updateOkxSymbols } from './exchanges/okx';
import { startBybitWebSocket, stopBybitWebSocket, updateBybitSymbols } from './exchanges/bybit';
import { startMexcWebSocket, stopMexcWebSocket, updateMexcSymbols } from './exchanges/mexc';
import { startGateWebSocket, stopGateWebSocket, updateGateSymbols } from './exchanges/gate';

export type { WebSocketPrice, PriceUpdateCallback };

const wsPrices: Map<string, WebSocketPrice> = new Map();

let priceCallback: PriceUpdateCallback | null = null;
let isRunning = false;

function handlePriceUpdate(price: WebSocketPrice): void {
  const key = `${price.exchange}:${price.symbol}:${price.quote}`;
  wsPrices.set(key, price);
  
  if (priceCallback) {
    priceCallback(price);
  }
}

export function startAllWebSockets(symbols: string[], onPriceUpdate?: PriceUpdateCallback): void {
  if (isRunning) return;
  
  isRunning = true;
  priceCallback = onPriceUpdate || null;
  
  console.log(`[WS-Manager] Starting WebSocket connections for ${symbols.length} symbols...`);
  
  startBinanceSpotWebSocket(symbols, handlePriceUpdate);
  startBinanceFuturesWebSocket(symbols, handlePriceUpdate);
  startOkxWebSocket(symbols, handlePriceUpdate);
  startBybitWebSocket(symbols, handlePriceUpdate);
  startMexcWebSocket(symbols, handlePriceUpdate);
  startGateWebSocket(symbols, handlePriceUpdate);
  
  console.log('[WS-Manager] All WebSocket connections initiated');
}

export function stopAllWebSockets(): void {
  if (!isRunning) return;
  
  console.log('[WS-Manager] Stopping all WebSocket connections...');
  
  stopBinanceSpotWebSocket();
  stopBinanceFuturesWebSocket();
  stopOkxWebSocket();
  stopBybitWebSocket();
  stopMexcWebSocket();
  stopGateWebSocket();
  
  wsPrices.clear();
  isRunning = false;
  
  console.log('[WS-Manager] All WebSocket connections stopped');
}

export function updateSymbols(symbols: string[]): void {
  updateBinanceSpotSymbols(symbols);
  updateBinanceFuturesSymbols(symbols);
  updateOkxSymbols(symbols);
  updateBybitSymbols(symbols);
  updateMexcSymbols(symbols);
  updateGateSymbols(symbols);
}

export function getWebSocketPrice(exchange: string, symbol: string, quote: string = 'USDT'): WebSocketPrice | undefined {
  const key = `${exchange}:${symbol}:${quote}`;
  return wsPrices.get(key);
}

export function getAllWebSocketPrices(): Map<string, WebSocketPrice> {
  return new Map(wsPrices);
}

export function getWebSocketPricesForExchange(exchange: string): WebSocketPrice[] {
  const prices: WebSocketPrice[] = [];
  wsPrices.forEach((price) => {
    if (price.exchange === exchange) {
      prices.push(price);
    }
  });
  return prices;
}

export function isWebSocketRunning(): boolean {
  return isRunning;
}

export function getWebSocketStats(): { exchange: string; count: number; lastUpdate: number }[] {
  const stats: Map<string, { count: number; lastUpdate: number }> = new Map();
  
  wsPrices.forEach((price) => {
    const existing = stats.get(price.exchange);
    if (!existing) {
      stats.set(price.exchange, { count: 1, lastUpdate: price.timestamp });
    } else {
      stats.set(price.exchange, {
        count: existing.count + 1,
        lastUpdate: Math.max(existing.lastUpdate, price.timestamp)
      });
    }
  });
  
  const result: { exchange: string; count: number; lastUpdate: number }[] = [];
  stats.forEach((data, exchange) => {
    result.push({ exchange, ...data });
  });
  return result;
}

export function getExchangeWsStatus(): Record<string, boolean> {
  return {
    BINANCE: isBinanceWsAvailable(),
    BINANCE_FUTURES: isBinanceFuturesWsAvailable()
  };
}

import WebSocket from 'ws';
import { WebSocketPrice, PriceUpdateCallback } from '../types';

const WS_URLS = [
  'wss://fstream.binance.com/ws/!miniTicker@arr',
  'wss://fstream.binance.vision/ws/!miniTicker@arr'
];
let currentUrlIndex = 0;

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let pingTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let callback: PriceUpdateCallback | null = null;
let targetSymbols: Set<string> = new Set();

let consecutiveFailures = 0;
const MAX_FAILURES = 5;
let circuitBroken = false;
let circuitResetTimer: NodeJS.Timeout | null = null;

export function startBinanceFuturesWebSocket(
  symbols: string[],
  onPriceUpdate: PriceUpdateCallback
): void {
  callback = onPriceUpdate;
  targetSymbols = new Set(symbols.map(s => s.toUpperCase()));
  
  if (circuitBroken) {
    console.log('[WS-Binance-Futures] Circuit breaker active - using REST fallback');
    return;
  }
  
  connect();
}

export function stopBinanceFuturesWebSocket(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (pingTimer) clearInterval(pingTimer);
  if (circuitResetTimer) clearTimeout(circuitResetTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnecting = false;
}

export function isBinanceFuturesWsAvailable(): boolean {
  return !circuitBroken && ws !== null && ws.readyState === WebSocket.OPEN;
}

function tripCircuitBreaker(): void {
  circuitBroken = true;
  console.log('[WS-Binance-Futures] Circuit breaker tripped - falling back to REST for 5 minutes');
  
  if (ws) {
    ws.close();
    ws = null;
  }
  
  circuitResetTimer = setTimeout(() => {
    console.log('[WS-Binance-Futures] Circuit breaker reset - attempting reconnection');
    circuitBroken = false;
    consecutiveFailures = 0;
    currentUrlIndex = 0;
    connect();
  }, 5 * 60 * 1000);
}

function connect(): void {
  if (circuitBroken) return;
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) return;
  
  isConnecting = true;
  const wsUrl = WS_URLS[currentUrlIndex % WS_URLS.length];
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      isConnecting = false;
      consecutiveFailures = 0;
      console.log('[WS-Binance-Futures] Connected');
      
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const tickers = JSON.parse(data.toString());
        const ts = Date.now();
        
        for (const ticker of tickers) {
          if (!ticker.s || !ticker.s.endsWith('USDT')) continue;
          
          const base = ticker.s.replace('USDT', '');
          if (!targetSymbols.has(base)) continue;
          
          const price: WebSocketPrice = {
            exchange: 'BINANCE_FUTURES',
            symbol: base,
            quote: 'USDT',
            price: parseFloat(ticker.c) || 0,
            timestamp: ts,
            change24hRate: parseFloat(ticker.o) > 0 
              ? ((parseFloat(ticker.c) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100 
              : 0,
            volume24hQuote: parseFloat(ticker.q) || 0
          };
          
          if (callback) callback(price);
        }
      } catch (err) {
        console.error('[WS-Binance-Futures] Parse error:', err);
      }
    });
    
    ws.on('error', (err) => {
      const errMsg = err.message || '';
      
      if (errMsg.includes('451') || errMsg.includes('Unexpected server response')) {
        console.error('[WS-Binance-Futures] Regional restriction detected (451)');
        consecutiveFailures = MAX_FAILURES;
      } else {
        console.error('[WS-Binance-Futures] Error:', errMsg);
        consecutiveFailures++;
      }
      
      currentUrlIndex++;
    });
    
    ws.on('close', () => {
      isConnecting = false;
      if (pingTimer) clearInterval(pingTimer);
      
      if (consecutiveFailures >= MAX_FAILURES) {
        tripCircuitBreaker();
        return;
      }
      
      const delay = Math.min(3000 * Math.pow(2, consecutiveFailures), 30000);
      console.log(`[WS-Binance-Futures] Disconnected, reconnecting in ${delay/1000}s (attempt ${consecutiveFailures + 1}/${MAX_FAILURES})`);
      reconnectTimer = setTimeout(connect, delay);
    });
    
    ws.on('pong', () => {});
    
  } catch (err) {
    console.error('[WS-Binance-Futures] Connection error:', err);
    isConnecting = false;
    consecutiveFailures++;
    
    if (consecutiveFailures >= MAX_FAILURES) {
      tripCircuitBreaker();
      return;
    }
    
    reconnectTimer = setTimeout(connect, 5000);
  }
}

export function updateBinanceFuturesSymbols(symbols: string[]): void {
  targetSymbols = new Set(symbols.map(s => s.toUpperCase()));
}

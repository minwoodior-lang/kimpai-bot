import WebSocket from 'ws';
import { WebSocketPrice, PriceUpdateCallback } from '../types';

const PROXY_BASE = process.env.PROXY_WS_BASE || 'wss://kimpai-price-proxy-1.onrender.com';
const WS_URLS = [
  `${PROXY_BASE}/ws/binance/spot`,
  'wss://stream.binance.com:9443/ws/!miniTicker@arr',
  'wss://data-stream.binance.vision/ws/!miniTicker@arr'
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

export function startBinanceSpotWebSocket(
  symbols: string[],
  onPriceUpdate: PriceUpdateCallback
): void {
  callback = onPriceUpdate;
  targetSymbols = new Set(symbols.map(s => s.toUpperCase()));
  
  if (circuitBroken) {
    console.log('[WS-Binance-Spot] Circuit breaker active - using REST fallback');
    return;
  }
  
  connect();
}

export function stopBinanceSpotWebSocket(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (pingTimer) clearInterval(pingTimer);
  if (circuitResetTimer) clearTimeout(circuitResetTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnecting = false;
}

export function isBinanceWsAvailable(): boolean {
  return !circuitBroken && ws !== null && ws.readyState === WebSocket.OPEN;
}

function tripCircuitBreaker(): void {
  circuitBroken = true;
  console.log('[WS-Binance-Spot] Circuit breaker tripped - falling back to REST for 5 minutes');
  
  if (ws) {
    ws.close();
    ws = null;
  }
  
  circuitResetTimer = setTimeout(() => {
    console.log('[WS-Binance-Spot] Circuit breaker reset - attempting reconnection');
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
      const isProxy = wsUrl.includes('onrender.com') || wsUrl.includes('proxy');
      console.log(`[WS-Binance-Spot] Connected${isProxy ? ' (via proxy)' : ''}`);
      
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
        
        let filteredCount = 0;
        let callbackCount = 0;
        
        for (const ticker of tickers) {
          if (!ticker.s || !ticker.s.endsWith('USDT')) continue;
          
          const base = ticker.s.replace('USDT', '');
          if (!targetSymbols.has(base)) {
            filteredCount++;
            continue;
          }
          
          const price: WebSocketPrice = {
            exchange: 'BINANCE',
            symbol: base,
            quote: 'USDT',
            price: parseFloat(ticker.c) || 0,
            timestamp: ts,
            change24hRate: parseFloat(ticker.o) > 0 
              ? ((parseFloat(ticker.c) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100 
              : 0,
            volume24hQuote: parseFloat(ticker.q) || 0,
            high24h: parseFloat(ticker.h) || 0,
            low24h: parseFloat(ticker.l) || 0
          };
          
          if (callback) {
            callback(price);
            callbackCount++;
          }
        }
        
        // 디버깅: callback 호출 횟수 (매 메시지마다 샘플링)
        if (Math.random() < 0.1) { // 10% 확률로 출력
          console.log(`[WS-Binance-Spot] Callback: ${callbackCount}, Filtered: ${filteredCount}, Targets: ${targetSymbols.size}`);
          // 샘플 심볼 출력 (처음 3개)
          const sampleTargets = Array.from(targetSymbols).slice(0, 3).join(', ');
          const sampleTickers = tickers.slice(0, 3).map((t: any) => t.s).join(', ');
          console.log(`[WS-Binance-Spot] Sample targets: [${sampleTargets}], sample tickers: [${sampleTickers}]`);
        }
      } catch (err) {
        console.error('[WS-Binance-Spot] Parse error:', err);
      }
    });
    
    ws.on('error', (err) => {
      const errMsg = err.message || '';
      
      if (errMsg.includes('451') || errMsg.includes('Unexpected server response')) {
        console.error('[WS-Binance-Spot] Regional restriction detected (451)');
        consecutiveFailures = MAX_FAILURES;
      } else {
        console.error('[WS-Binance-Spot] Error:', errMsg);
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
      console.log(`[WS-Binance-Spot] Disconnected, reconnecting in ${delay/1000}s (attempt ${consecutiveFailures + 1}/${MAX_FAILURES})`);
      reconnectTimer = setTimeout(connect, delay);
    });
    
    ws.on('pong', () => {});
    
  } catch (err) {
    console.error('[WS-Binance-Spot] Connection error:', err);
    isConnecting = false;
    consecutiveFailures++;
    
    if (consecutiveFailures >= MAX_FAILURES) {
      tripCircuitBreaker();
      return;
    }
    
    reconnectTimer = setTimeout(connect, 5000);
  }
}

export function updateBinanceSpotSymbols(symbols: string[]): void {
  targetSymbols = new Set(symbols.map(s => s.toUpperCase()));
}

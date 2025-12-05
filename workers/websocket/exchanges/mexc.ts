import WebSocket from 'ws';
import { WebSocketPrice, PriceUpdateCallback } from '../types';

const WS_URL = 'wss://wbs.mexc.com/ws';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let pingTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let callback: PriceUpdateCallback | null = null;
let targetSymbols: Set<string> = new Set();

export function startMexcWebSocket(
  symbols: string[],
  onPriceUpdate: PriceUpdateCallback
): void {
  callback = onPriceUpdate;
  targetSymbols = new Set(symbols.map(s => s.toUpperCase()));
  connect();
}

export function stopMexcWebSocket(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (pingTimer) clearInterval(pingTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnecting = false;
}

function connect(): void {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) return;
  
  isConnecting = true;
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      isConnecting = false;
      console.log('[WS-MEXC] Connected');
      
      const params = Array.from(targetSymbols).map(s => 
        `spot@public.miniTicker.v3.api@${s}USDT`
      );
      
      if (params.length > 0) {
        const batchSize = 25;
        for (let i = 0; i < params.length; i += batchSize) {
          const batch = params.slice(i, i + batchSize);
          ws!.send(JSON.stringify({
            method: 'SUBSCRIPTION',
            params: batch
          }));
        }
      }
      
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: 'PING' }));
        }
      }, 15000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = data.toString();
        
        if (msg.includes('"msg":"PONG"')) return;
        
        const parsed = JSON.parse(msg);
        
        if (parsed.c && parsed.c.includes('miniTicker')) {
          const ticker = parsed.d;
          if (!ticker) return;
          
          const symbol = ticker.s || '';
          if (!symbol.endsWith('USDT')) return;
          
          const base = symbol.replace('USDT', '');
          if (!targetSymbols.has(base)) return;
          
          const lastPrice = parseFloat(ticker.c) || 0;
          const openPrice = parseFloat(ticker.o) || 0;
          
          const price: WebSocketPrice = {
            exchange: 'MEXC',
            symbol: base,
            quote: 'USDT',
            price: lastPrice,
            timestamp: Date.now(),
            change24hRate: openPrice > 0 ? ((lastPrice - openPrice) / openPrice) * 100 : 0,
            volume24hQuote: parseFloat(ticker.q) || 0,
            high24h: parseFloat(ticker.h) || 0,
            low24h: parseFloat(ticker.l) || 0
          };
          
          if (callback) callback(price);
        }
      } catch (err) {
        // ignore parse errors
      }
    });
    
    ws.on('error', (err) => {
      console.error('[WS-MEXC] Error:', err.message);
    });
    
    ws.on('close', () => {
      console.log('[WS-MEXC] Disconnected, reconnecting in 3s...');
      isConnecting = false;
      if (pingTimer) clearInterval(pingTimer);
      
      reconnectTimer = setTimeout(connect, 3000);
    });
    
  } catch (err) {
    console.error('[WS-MEXC] Connection error:', err);
    isConnecting = false;
    reconnectTimer = setTimeout(connect, 5000);
  }
}

export function updateMexcSymbols(symbols: string[]): void {
  targetSymbols = new Set(symbols.map(s => s.toUpperCase()));
}

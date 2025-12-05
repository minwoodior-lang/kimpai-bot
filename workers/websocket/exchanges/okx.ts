import WebSocket from 'ws';
import { WebSocketPrice, PriceUpdateCallback } from '../types';

const WS_URL = 'wss://ws.okx.com:8443/ws/v5/public';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let pingTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let callback: PriceUpdateCallback | null = null;
let targetSymbols: string[] = [];

const invalidSymbols: Set<string> = new Set();
let errorLogCount = 0;
const MAX_ERROR_LOGS = 5;

export function startOkxWebSocket(
  symbols: string[],
  onPriceUpdate: PriceUpdateCallback
): void {
  callback = onPriceUpdate;
  targetSymbols = symbols.map(s => s.toUpperCase());
  connect();
}

export function stopOkxWebSocket(): void {
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
      errorLogCount = 0;
      console.log('[WS-OKX] Connected');
      
      const validSymbols = targetSymbols.filter(s => !invalidSymbols.has(s));
      const args = validSymbols.map(s => ({
        channel: 'tickers',
        instId: `${s}-USDT`
      }));
      
      if (args.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < args.length; i += batchSize) {
          const batch = args.slice(i, i + batchSize);
          setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 'subscribe', args: batch }));
            }
          }, Math.floor(i / batchSize) * 100);
        }
        console.log(`[WS-OKX] Subscribing to ${validSymbols.length} symbols (${invalidSymbols.size} skipped)`);
      }
      
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 25000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = data.toString();
        if (msg === 'pong') return;
        
        const parsed = JSON.parse(msg);
        
        if (parsed.event === 'subscribe') return;
        if (parsed.event === 'error') {
          if (parsed.code === '60018' && parsed.msg) {
            const match = parsed.msg.match(/instId:([^-]+)-USDT/);
            if (match) {
              invalidSymbols.add(match[1]);
            }
            if (errorLogCount < MAX_ERROR_LOGS) {
              errorLogCount++;
              if (errorLogCount === MAX_ERROR_LOGS) {
                console.log(`[WS-OKX] Suppressing further symbol errors (${invalidSymbols.size} invalid symbols cached)`);
              }
            }
          } else {
            console.error('[WS-OKX] Error:', parsed);
          }
          return;
        }
        
        if (parsed.data && Array.isArray(parsed.data)) {
          const ts = Date.now();
          for (const ticker of parsed.data) {
            const [base, quote] = (ticker.instId || '').split('-');
            if (quote !== 'USDT') continue;
            
            const lastPrice = parseFloat(ticker.last) || 0;
            const open24h = parseFloat(ticker.open24h) || 0;
            
            const price: WebSocketPrice = {
              exchange: 'OKX',
              symbol: base,
              quote: 'USDT',
              price: lastPrice,
              timestamp: ts,
              change24hRate: open24h > 0 ? ((lastPrice - open24h) / open24h) * 100 : 0,
              volume24hQuote: parseFloat(ticker.volCcy24h) || 0,
              high24h: parseFloat(ticker.high24h) || 0,
              low24h: parseFloat(ticker.low24h) || 0
            };
            
            if (callback) callback(price);
          }
        }
      } catch (err) {
        // ignore parse errors for pong messages
      }
    });
    
    ws.on('error', (err) => {
      console.error('[WS-OKX] Error:', err.message);
    });
    
    ws.on('close', () => {
      console.log('[WS-OKX] Disconnected, reconnecting in 3s...');
      isConnecting = false;
      if (pingTimer) clearInterval(pingTimer);
      
      reconnectTimer = setTimeout(connect, 3000);
    });
    
  } catch (err) {
    console.error('[WS-OKX] Connection error:', err);
    isConnecting = false;
    reconnectTimer = setTimeout(connect, 5000);
  }
}

export function updateOkxSymbols(newSymbols: string[]): void {
  const newSet = newSymbols.map(s => s.toUpperCase()).filter(s => !invalidSymbols.has(s));
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    const oldArgs = targetSymbols.filter(s => !invalidSymbols.has(s)).map(s => ({
      channel: 'tickers',
      instId: `${s}-USDT`
    }));
    if (oldArgs.length > 0) {
      ws.send(JSON.stringify({ op: 'unsubscribe', args: oldArgs }));
    }
    
    const newArgs = newSet.map(s => ({
      channel: 'tickers',
      instId: `${s}-USDT`
    }));
    if (newArgs.length > 0) {
      ws.send(JSON.stringify({ op: 'subscribe', args: newArgs }));
    }
  }
  
  targetSymbols = newSymbols.map(s => s.toUpperCase());
}

export function getOkxInvalidSymbols(): Set<string> {
  return new Set(invalidSymbols);
}

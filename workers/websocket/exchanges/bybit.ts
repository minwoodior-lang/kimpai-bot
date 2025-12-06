import WebSocket from 'ws';
import { WebSocketPrice, PriceUpdateCallback } from '../types';

const WS_URL = 'wss://stream.bybit.com/v5/public/spot';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let pingTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let callback: PriceUpdateCallback | null = null;
let targetSymbols: string[] = [];
let failedSymbols: Set<string> = new Set();

export function startBybitWebSocket(
  symbols: string[],
  onPriceUpdate: PriceUpdateCallback
): void {
  callback = onPriceUpdate;
  targetSymbols = symbols.map(s => s.toUpperCase());
  connect();
}

export function stopBybitWebSocket(): void {
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
      console.log('[WS-Bybit] Connected');
      
      const validArgs = targetSymbols
        .filter(s => !failedSymbols.has(s))
        .map(s => `tickers.${s}USDT`);
      
      if (validArgs.length > 0) {
        const batchSize = 5;
        for (let i = 0; i < validArgs.length; i += batchSize) {
          const batch = validArgs.slice(i, i + batchSize);
          ws!.send(JSON.stringify({
            op: 'subscribe',
            args: batch
          }));
        }
        console.log(`[WS-Bybit] Subscribing to ${validArgs.length} symbols (${failedSymbols.size} skipped) in ${Math.ceil(validArgs.length / batchSize)} batches`);
      }
      
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 'ping' }));
        }
      }, 20000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());
        
        if (parsed.op === 'pong' || parsed.ret_msg === 'pong') return;
        if (parsed.op === 'subscribe') {
          if (!parsed.success) {
            if (parsed.args && Array.isArray(parsed.args)) {
              parsed.args.forEach((arg: string) => {
                const symbol = arg.replace('tickers.', '').replace('USDT', '');
                failedSymbols.add(symbol);
              });
            }
          }
          return;
        }
        
        if (parsed.topic && parsed.topic.startsWith('tickers.') && parsed.data) {
          const ticker = parsed.data;
          const symbol = ticker.symbol || '';
          
          if (!symbol.endsWith('USDT')) return;
          const base = symbol.replace('USDT', '');
          
          const lastPrice = parseFloat(ticker.lastPrice) || 0;
          const prevPrice = parseFloat(ticker.prevPrice24h) || 0;
          
          const price: WebSocketPrice = {
            exchange: 'BYBIT',
            symbol: base,
            quote: 'USDT',
            price: lastPrice,
            timestamp: Date.now(),
            change24hRate: (parseFloat(ticker.price24hPcnt) || 0) * 100,
            volume24hQuote: parseFloat(ticker.turnover24h) || 0,
            high24h: parseFloat(ticker.highPrice24h) || 0,
            low24h: parseFloat(ticker.lowPrice24h) || 0
          };
          
          if (callback) callback(price);
        }
      } catch (err) {
        // ignore parse errors
      }
    });
    
    ws.on('error', (err) => {
      console.error('[WS-Bybit] Error:', err.message);
    });
    
    ws.on('close', () => {
      console.log('[WS-Bybit] Disconnected, reconnecting in 5s...');
      isConnecting = false;
      if (pingTimer) clearInterval(pingTimer);
      
      reconnectTimer = setTimeout(connect, 5000);
    });
    
  } catch (err) {
    console.error('[WS-Bybit] Connection error:', err);
    isConnecting = false;
    reconnectTimer = setTimeout(connect, 5000);
  }
}

export function updateBybitSymbols(newSymbols: string[]): void {
  const newSet = newSymbols.map(s => s.toUpperCase());
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    const oldArgs = targetSymbols.map(s => `tickers.${s}USDT`);
    if (oldArgs.length > 0) {
      ws.send(JSON.stringify({ op: 'unsubscribe', args: oldArgs }));
    }
    
    const newArgs = newSet.map(s => `tickers.${s}USDT`);
    if (newArgs.length > 0) {
      ws.send(JSON.stringify({ op: 'subscribe', args: newArgs }));
    }
  }
  
  targetSymbols = newSet;
}

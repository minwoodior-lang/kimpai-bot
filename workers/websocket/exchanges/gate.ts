import WebSocket from 'ws';
import { WebSocketPrice, PriceUpdateCallback } from '../types';

const WS_URL = 'wss://api.gateio.ws/ws/v4/';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let pingTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let callback: PriceUpdateCallback | null = null;
let targetSymbols: string[] = [];

export function startGateWebSocket(
  symbols: string[],
  onPriceUpdate: PriceUpdateCallback
): void {
  callback = onPriceUpdate;
  targetSymbols = symbols.map(s => s.toUpperCase());
  connect();
}

export function stopGateWebSocket(): void {
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
      console.log('[WS-Gate] Connected');
      
      const payload = targetSymbols.map(s => `${s}_USDT`);
      
      if (payload.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < payload.length; i += batchSize) {
          const batch = payload.slice(i, i + batchSize);
          ws!.send(JSON.stringify({
            time: Math.floor(Date.now() / 1000),
            channel: 'spot.tickers',
            event: 'subscribe',
            payload: batch
          }));
        }
      }
      
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            time: Math.floor(Date.now() / 1000),
            channel: 'spot.ping'
          }));
        }
      }, 25000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());
        
        if (parsed.channel === 'spot.pong') return;
        if (parsed.event === 'subscribe') return;
        
        if (parsed.channel === 'spot.tickers' && parsed.event === 'update' && parsed.result) {
          const ticker = parsed.result;
          const pair = ticker.currency_pair || '';
          
          if (!pair.endsWith('_USDT')) return;
          const base = pair.replace('_USDT', '');
          
          const lastPrice = parseFloat(ticker.last) || 0;
          const change = parseFloat(ticker.change_percentage) || 0;
          
          const price: WebSocketPrice = {
            exchange: 'GATE',
            symbol: base,
            quote: 'USDT',
            price: lastPrice,
            timestamp: Date.now(),
            change24hRate: change,
            volume24hQuote: parseFloat(ticker.quote_volume) || 0,
            high24h: parseFloat(ticker.high_24h) || 0,
            low24h: parseFloat(ticker.low_24h) || 0
          };
          
          if (callback) callback(price);
        }
      } catch (err) {
        // ignore parse errors
      }
    });
    
    ws.on('error', (err) => {
      console.error('[WS-Gate] Error:', err.message);
    });
    
    ws.on('close', () => {
      console.log('[WS-Gate] Disconnected, reconnecting in 3s...');
      isConnecting = false;
      if (pingTimer) clearInterval(pingTimer);
      
      reconnectTimer = setTimeout(connect, 3000);
    });
    
  } catch (err) {
    console.error('[WS-Gate] Connection error:', err);
    isConnecting = false;
    reconnectTimer = setTimeout(connect, 5000);
  }
}

export function updateGateSymbols(newSymbols: string[]): void {
  const newSet = newSymbols.map(s => s.toUpperCase());
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    const oldPayload = targetSymbols.map(s => `${s}_USDT`);
    if (oldPayload.length > 0) {
      ws.send(JSON.stringify({
        time: Math.floor(Date.now() / 1000),
        channel: 'spot.tickers',
        event: 'unsubscribe',
        payload: oldPayload
      }));
    }
    
    const newPayload = newSet.map(s => `${s}_USDT`);
    if (newPayload.length > 0) {
      ws.send(JSON.stringify({
        time: Math.floor(Date.now() / 1000),
        channel: 'spot.tickers',
        event: 'subscribe',
        payload: newPayload
      }));
    }
  }
  
  targetSymbols = newSet;
}

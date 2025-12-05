import { useState, useEffect, useCallback, useRef } from 'react';

interface PremiumData {
  symbol: string;
  name?: string;
  koreanName?: string;
  koreanPrice?: number;
  globalPrice?: number | null;
  globalPriceKrw?: number | null;
  premium?: number | null;
  volume24hKrw?: number | null;
  volume24hForeignKrw?: number | null;
  change24h?: number | null;
  domesticExchange?: string;
  foreignExchange?: string;
  isListed?: boolean;
  cmcSlug?: string;
}

interface SSEResponse {
  success: boolean;
  data: PremiumData[];
  fxRate: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
  totalCoins: number;
  listedCoins: number;
  averagePremium?: number;
}

interface UseSSEPricesOptions {
  domestic: string;
  foreign: string;
  enabled?: boolean;
  onUpdate?: (data: SSEResponse) => void;
}

export function useSSEPrices({
  domestic,
  foreign,
  enabled = true,
  onUpdate
}: UseSSEPricesOptions) {
  const [data, setData] = useState<PremiumData[]>([]);
  const [fxRate, setFxRate] = useState(0);
  const [updatedAt, setUpdatedAt] = useState('');
  const [totalCoins, setTotalCoins] = useState(0);
  const [listedCoins, setListedCoins] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/premium/stream?domestic=${domestic}&foreign=${foreign}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed: SSEResponse = JSON.parse(event.data);
        
        if (parsed.success && Array.isArray(parsed.data)) {
          setData(parsed.data);
          setFxRate(parsed.fxRate || 0);
          setUpdatedAt(parsed.updatedAt || new Date().toISOString());
          setTotalCoins(parsed.totalCoins || 0);
          setListedCoins(parsed.listedCoins || 0);
          
          if (onUpdate) {
            onUpdate(parsed);
          }
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost');
      eventSource.close();
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [domestic, foreign, enabled, onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    data,
    fxRate,
    updatedAt,
    totalCoins,
    listedCoins,
    isConnected,
    error,
    disconnect,
    reconnect: connect
  };
}

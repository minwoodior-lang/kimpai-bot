import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface PriceFeedStatus {
  exchange: string;
  status: 'ok' | 'warning' | 'critical';
  lastUpdate: number;
  tickCount: number;
  wsConnected: boolean;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const pricesPath = path.join(process.cwd(), 'data', 'prices.json');
    let pricesData: Record<string, any> = {};
    
    if (fs.existsSync(pricesPath)) {
      const content = fs.readFileSync(pricesPath, 'utf-8');
      pricesData = JSON.parse(content);
    }

    const exchanges = [
      'UPBIT', 'BITHUMB', 'COINONE', 
      'BINANCE', 'OKX', 'BYBIT', 'BITGET', 'GATE', 'MEXC', 'HTX',
      'BINANCE_FUTURES'
    ];

    const now = Date.now();
    const feeds: PriceFeedStatus[] = exchanges.map(exchange => {
      const exchangePrices = Object.entries(pricesData).filter(([key]) => 
        key.startsWith(`${exchange}:`)
      );
      
      let lastUpdate = 0;
      let tickCount = 0;
      
      for (const [, value] of exchangePrices) {
        const price = value as { timestamp?: number };
        if (price.timestamp) {
          if (price.timestamp > lastUpdate) {
            lastUpdate = price.timestamp;
          }
          if (now - price.timestamp < 60000) {
            tickCount++;
          }
        }
      }

      const ageSeconds = lastUpdate > 0 ? (now - lastUpdate) / 1000 : 999999;
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      
      if (ageSeconds > 300) {
        status = 'critical';
      } else if (ageSeconds > 60) {
        status = 'warning';
      }

      return {
        exchange,
        status,
        lastUpdate,
        tickCount,
        wsConnected: ageSeconds < 10
      };
    });

    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ success: true, data: feeds });
  } catch (err) {
    console.error('[API] /admin/price-feeds error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get price feeds status' });
  }
}

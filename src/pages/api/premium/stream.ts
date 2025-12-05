import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const PREMIUM_TABLE_FILE = path.join(process.cwd(), 'data', 'premiumTable.json');
const MARKET_STATS_FILE = path.join(process.cwd(), 'data', 'marketStats.json');

let lastData: string = '';
let lastModTime: number = 0;

function loadPremiumTable(): any[] {
  try {
    const stat = fs.statSync(PREMIUM_TABLE_FILE);
    if (stat.mtimeMs === lastModTime) {
      return JSON.parse(lastData);
    }
    lastData = fs.readFileSync(PREMIUM_TABLE_FILE, 'utf-8');
    lastModTime = stat.mtimeMs;
    return JSON.parse(lastData);
  } catch {
    return [];
  }
}

function loadMarketStats(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(MARKET_STATS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function getFilteredData(domestic: string, foreign: string): any {
  const premiumTable = loadPremiumTable();
  const marketStats = loadMarketStats();
  
  const [domesticExchange, domesticQuote] = domestic.split('_');
  const [foreignExchange, foreignQuote] = foreign.split('_');
  
  const fxRate = 1450;
  
  const filtered = premiumTable.map((row: any) => {
    const domesticKey = `${domesticExchange}:${row.symbol}:${domesticQuote}`;
    const foreignKey = `${foreignExchange}:${row.symbol}:${foreignQuote}`;
    const domesticStats = marketStats[domesticKey];
    const foreignStats = marketStats[foreignKey];
    
    return {
      symbol: row.symbol,
      name: row.name_en || row.symbol,
      koreanName: row.name_ko || row.symbol,
      koreanPrice: row.koreanPrice,
      globalPrice: row.globalPrice,
      globalPriceKrw: row.globalPrice ? row.globalPrice * fxRate : null,
      premium: row.premium,
      volume24hKrw: row.volume24hKrw,
      volume24hForeignKrw: row.volume24hForeignKrw,
      change24h: domesticStats?.change24hRate ?? row.change24hRate,
      domesticExchange,
      foreignExchange,
      isListed: row.globalPrice !== null,
      cmcSlug: row.cmcSlug
    };
  }).filter((row: any) => row.koreanPrice || row.globalPrice);
  
  return {
    success: true,
    data: filtered,
    fxRate,
    updatedAt: new Date().toISOString(),
    domesticExchange: domestic,
    foreignExchange: foreign,
    totalCoins: filtered.length,
    listedCoins: filtered.filter((r: any) => r.isListed).length
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const domestic = (req.query.domestic as string) || 'UPBIT_KRW';
  const foreign = (req.query.foreign as string) || 'BINANCE_USDT';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let lastSent = '';
  let intervalId: NodeJS.Timeout;

  const sendUpdate = () => {
    try {
      const data = getFilteredData(domestic, foreign);
      const jsonStr = JSON.stringify(data);
      
      if (jsonStr !== lastSent) {
        res.write(`data: ${jsonStr}\n\n`);
        lastSent = jsonStr;
      }
    } catch (err) {
      console.error('[SSE] Error sending update:', err);
    }
  };

  sendUpdate();

  intervalId = setInterval(sendUpdate, 200);

  req.on('close', () => {
    clearInterval(intervalId);
  });

  req.on('error', () => {
    clearInterval(intervalId);
  });
}

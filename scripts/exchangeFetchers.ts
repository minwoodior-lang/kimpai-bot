export interface ExchangePrice {
  exchange: string;
  symbol: string;
  base: string;
  quote: string;
  price: number;
  priceKrw: number;
  volume24h: number | null;
  change24h: number | null;
}

const SYMBOLS = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX'];

export async function fetchUpbitKRW(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const markets = SYMBOLS.map(s => `KRW-${s}`).join(',');
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
    const data = await response.json();
    
    return data.map((ticker: any) => {
      const symbol = ticker.market.replace('KRW-', '');
      return {
        exchange: 'UPBIT',
        symbol,
        base: symbol,
        quote: 'KRW',
        price: ticker.trade_price,
        priceKrw: ticker.trade_price,
        volume24h: ticker.acc_trade_price_24h,
        change24h: ticker.signed_change_rate * 100,
      };
    });
  } catch (error) {
    console.error('Upbit KRW fetch error:', error);
    return [];
  }
}

export async function fetchUpbitBTC(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const markets = SYMBOLS.filter(s => s !== 'BTC').map(s => `BTC-${s}`).join(',');
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
    const data = await response.json();
    
    const btcKrwRes = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC');
    const btcKrwData = await btcKrwRes.json();
    const btcKrwPrice = btcKrwData[0]?.trade_price || 0;
    
    return data.map((ticker: any) => {
      const symbol = ticker.market.replace('BTC-', '');
      const priceInBtc = ticker.trade_price;
      return {
        exchange: 'UPBIT',
        symbol,
        base: symbol,
        quote: 'BTC',
        price: priceInBtc,
        priceKrw: priceInBtc * btcKrwPrice,
        volume24h: ticker.acc_trade_price_24h,
        change24h: ticker.signed_change_rate * 100,
      };
    });
  } catch (error) {
    console.error('Upbit BTC fetch error:', error);
    return [];
  }
}

export async function fetchBithumbKRW(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.bithumb.com/public/ticker/ALL_KRW');
    const data = await response.json();
    
    if (data.status !== '0000') return [];
    
    const results: ExchangePrice[] = [];
    for (const symbol of SYMBOLS) {
      const ticker = data.data[symbol];
      if (ticker) {
        results.push({
          exchange: 'BITHUMB',
          symbol,
          base: symbol,
          quote: 'KRW',
          price: Number(ticker.closing_price),
          priceKrw: Number(ticker.closing_price),
          volume24h: Number(ticker.acc_trade_value_24H) || null,
          change24h: Number(ticker.fluctate_rate_24H) || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Bithumb KRW fetch error:', error);
    return [];
  }
}

export async function fetchBithumbBTC(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.bithumb.com/public/ticker/ALL_BTC');
    const data = await response.json();
    
    if (data.status !== '0000') return [];
    
    const btcKrwRes = await fetch('https://api.bithumb.com/public/ticker/BTC_KRW');
    const btcKrwData = await btcKrwRes.json();
    const btcKrwPrice = Number(btcKrwData.data?.closing_price) || 0;
    
    const results: ExchangePrice[] = [];
    for (const symbol of SYMBOLS.filter(s => s !== 'BTC')) {
      const ticker = data.data[symbol];
      if (ticker) {
        const priceInBtc = Number(ticker.closing_price);
        results.push({
          exchange: 'BITHUMB',
          symbol,
          base: symbol,
          quote: 'BTC',
          price: priceInBtc,
          priceKrw: priceInBtc * btcKrwPrice,
          volume24h: Number(ticker.acc_trade_value_24H) || null,
          change24h: Number(ticker.fluctate_rate_24H) || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Bithumb BTC fetch error:', error);
    return [];
  }
}

export async function fetchCoinoneKRW(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.coinone.co.kr/public/v2/ticker_new/krw');
    const data = await response.json();
    
    if (data.result !== 'success') return [];
    
    const results: ExchangePrice[] = [];
    for (const ticker of data.tickers) {
      const symbol = ticker.target_currency.toUpperCase();
      if (SYMBOLS.includes(symbol)) {
        const price = Number(ticker.last);
        const openPrice = Number(ticker.first);
        const change24h = openPrice > 0 ? ((price - openPrice) / openPrice) * 100 : null;
        
        results.push({
          exchange: 'COINONE',
          symbol,
          base: symbol,
          quote: 'KRW',
          price,
          priceKrw: price,
          volume24h: Number(ticker.quote_volume) || null,
          change24h,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Coinone KRW fetch error:', error);
    return [];
  }
}

export async function fetchBinanceUSDT(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const symbols = SYMBOLS.map(s => `"${s}USDT"`).join(',');
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
    const data = await response.json();
    
    return data.map((ticker: any) => {
      const symbol = ticker.symbol.replace('USDT', '');
      return {
        exchange: 'BINANCE',
        symbol,
        base: symbol,
        quote: 'USDT',
        price: Number(ticker.lastPrice),
        priceKrw: Number(ticker.lastPrice) * fxRate,
        volume24h: Number(ticker.quoteVolume) || null,
        change24h: Number(ticker.priceChangePercent) || null,
      };
    });
  } catch (error) {
    console.error('Binance USDT fetch error:', error);
    return [];
  }
}

export async function fetchBinanceBTC(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const symbols = SYMBOLS.filter(s => s !== 'BTC').map(s => `"${s}BTC"`).join(',');
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
    const data = await response.json();
    
    const btcUsdtRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const btcUsdtData = await btcUsdtRes.json();
    const btcUsdtPrice = Number(btcUsdtData.price) || 0;
    
    return data.map((ticker: any) => {
      const symbol = ticker.symbol.replace('BTC', '');
      const priceInBtc = Number(ticker.lastPrice);
      return {
        exchange: 'BINANCE',
        symbol,
        base: symbol,
        quote: 'BTC',
        price: priceInBtc,
        priceKrw: priceInBtc * btcUsdtPrice * fxRate,
        volume24h: Number(ticker.quoteVolume) || null,
        change24h: Number(ticker.priceChangePercent) || null,
      };
    });
  } catch (error) {
    console.error('Binance BTC fetch error:', error);
    return [];
  }
}

export async function fetchBinanceFutures(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
    const data = await response.json();
    
    const results: ExchangePrice[] = [];
    for (const ticker of data) {
      const symbol = ticker.symbol.replace('USDT', '');
      if (SYMBOLS.includes(symbol) && ticker.symbol.endsWith('USDT')) {
        results.push({
          exchange: 'BINANCE_FUTURES',
          symbol,
          base: symbol,
          quote: 'USDT',
          price: Number(ticker.lastPrice),
          priceKrw: Number(ticker.lastPrice) * fxRate,
          volume24h: Number(ticker.quoteVolume) || null,
          change24h: Number(ticker.priceChangePercent) || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Binance Futures fetch error:', error);
    return [];
  }
}

export async function fetchOKX(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const data = await response.json();
    
    if (data.code !== '0') return [];
    
    const results: ExchangePrice[] = [];
    for (const ticker of data.data) {
      const parts = ticker.instId.split('-');
      const symbol = parts[0];
      const quote = parts[1];
      
      if (SYMBOLS.includes(symbol) && quote === 'USDT') {
        const price = Number(ticker.last);
        const open = Number(ticker.open24h);
        const change24h = open > 0 ? ((price - open) / open) * 100 : null;
        
        results.push({
          exchange: 'OKX',
          symbol,
          base: symbol,
          quote: 'USDT',
          price,
          priceKrw: price * fxRate,
          volume24h: Number(ticker.volCcy24h) || null,
          change24h,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('OKX fetch error:', error);
    return [];
  }
}

export async function fetchBybit(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.bybit.com/v5/market/tickers?category=spot');
    const data = await response.json();
    
    if (data.retCode !== 0) return [];
    
    const results: ExchangePrice[] = [];
    for (const ticker of data.result.list) {
      const symbol = ticker.symbol.replace('USDT', '');
      if (SYMBOLS.includes(symbol) && ticker.symbol.endsWith('USDT')) {
        results.push({
          exchange: 'BYBIT',
          symbol,
          base: symbol,
          quote: 'USDT',
          price: Number(ticker.lastPrice),
          priceKrw: Number(ticker.lastPrice) * fxRate,
          volume24h: Number(ticker.turnover24h) || null,
          change24h: Number(ticker.price24hPcnt) * 100 || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Bybit fetch error:', error);
    return [];
  }
}

export async function fetchBitget(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.bitget.com/api/v2/spot/market/tickers');
    const data = await response.json();
    
    if (data.code !== '00000') return [];
    
    const results: ExchangePrice[] = [];
    for (const ticker of data.data) {
      const symbol = ticker.symbol.replace('USDT', '');
      if (SYMBOLS.includes(symbol) && ticker.symbol.endsWith('USDT')) {
        results.push({
          exchange: 'BITGET',
          symbol,
          base: symbol,
          quote: 'USDT',
          price: Number(ticker.lastPr),
          priceKrw: Number(ticker.lastPr) * fxRate,
          volume24h: Number(ticker.usdtVolume) || null,
          change24h: Number(ticker.change24h) * 100 || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Bitget fetch error:', error);
    return [];
  }
}

export async function fetchGate(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
    const data = await response.json();
    
    const results: ExchangePrice[] = [];
    for (const ticker of data) {
      const parts = ticker.currency_pair.split('_');
      const symbol = parts[0];
      const quote = parts[1];
      
      if (SYMBOLS.includes(symbol) && quote === 'USDT') {
        results.push({
          exchange: 'GATE',
          symbol,
          base: symbol,
          quote: 'USDT',
          price: Number(ticker.last),
          priceKrw: Number(ticker.last) * fxRate,
          volume24h: Number(ticker.quote_volume) || null,
          change24h: Number(ticker.change_percentage) || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Gate fetch error:', error);
    return [];
  }
}

export async function fetchHTX(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.huobi.pro/market/tickers');
    const data = await response.json();
    
    if (data.status !== 'ok') return [];
    
    const results: ExchangePrice[] = [];
    for (const ticker of data.data) {
      const symbolLower = ticker.symbol;
      for (const sym of SYMBOLS) {
        if (symbolLower === `${sym.toLowerCase()}usdt`) {
          const change24h = ticker.open > 0 ? ((ticker.close - ticker.open) / ticker.open) * 100 : null;
          results.push({
            exchange: 'HTX',
            symbol: sym,
            base: sym,
            quote: 'USDT',
            price: ticker.close,
            priceKrw: ticker.close * fxRate,
            volume24h: ticker.vol || null,
            change24h,
          });
          break;
        }
      }
    }
    return results;
  } catch (error) {
    console.error('HTX fetch error:', error);
    return [];
  }
}

export async function fetchMEXC(fxRate: number): Promise<ExchangePrice[]> {
  try {
    const response = await fetch('https://api.mexc.com/api/v3/ticker/24hr');
    const data = await response.json();
    
    const results: ExchangePrice[] = [];
    for (const ticker of data) {
      const symbol = ticker.symbol.replace('USDT', '');
      if (SYMBOLS.includes(symbol) && ticker.symbol.endsWith('USDT')) {
        results.push({
          exchange: 'MEXC',
          symbol,
          base: symbol,
          quote: 'USDT',
          price: Number(ticker.lastPrice),
          priceKrw: Number(ticker.lastPrice) * fxRate,
          volume24h: Number(ticker.quoteVolume) || null,
          change24h: Number(ticker.priceChangePercent) * 100 || null,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('MEXC fetch error:', error);
    return [];
  }
}

export async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.KRW || 1400;
  } catch {
    return 1400;
  }
}

export const allFetchers = [
  { name: 'UPBIT_KRW', fn: fetchUpbitKRW },
  { name: 'UPBIT_BTC', fn: fetchUpbitBTC },
  { name: 'BITHUMB_KRW', fn: fetchBithumbKRW },
  { name: 'BITHUMB_BTC', fn: fetchBithumbBTC },
  { name: 'COINONE_KRW', fn: fetchCoinoneKRW },
  { name: 'BINANCE_USDT', fn: fetchBinanceUSDT },
  { name: 'BINANCE_BTC', fn: fetchBinanceBTC },
  { name: 'BINANCE_FUTURES', fn: fetchBinanceFutures },
  { name: 'OKX_USDT', fn: fetchOKX },
  { name: 'BYBIT_USDT', fn: fetchBybit },
  { name: 'BITGET_USDT', fn: fetchBitget },
  { name: 'GATE_USDT', fn: fetchGate },
  { name: 'HTX_USDT', fn: fetchHTX },
  { name: 'MEXC_USDT', fn: fetchMEXC },
];

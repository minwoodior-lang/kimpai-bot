import { createClient } from "@supabase/supabase-js";
import { getCoinMetadata } from "./coinMetadata";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MasterSymbol {
  base_symbol: string;
  ko_name: string | null;
  coingecko_id: string | null;
  icon_url: string | null;
}

async function initializeMasterSymbols() {
  console.log('[MasterSymbols] Initializing...');

  try {
    const coinMetadataObj = getCoinMetadata();
    if (!coinMetadataObj || typeof coinMetadataObj !== 'object') {
      throw new Error('Invalid coin metadata');
    }
    
    // Get Korean names from Upbit
    const upbitResponse = await fetch('https://api.upbit.com/v1/market/all?isDetails=true');
    const upbitMarkets: Array<{ market: string; korean_name?: string }> = await upbitResponse.json();
    
    const koNameMap = new Map<string, string>();
    for (const market of upbitMarkets) {
      const parts = market.market.split('-');
      const symbol = parts.length === 2 ? parts[1] : market.market;
      if (market.korean_name) {
        koNameMap.set(symbol, market.korean_name);
      }
    }

    // Prepare master symbols data
    const masterSymbols: MasterSymbol[] = [];
    
    const entries = Object.entries(coinMetadataObj);
    for (const [symbol, metadata] of entries) {
      const koName = koNameMap.get(symbol) || null;
      const metaObj = metadata as any;
      masterSymbols.push({
        base_symbol: symbol,
        ko_name: koName,
        coingecko_id: metaObj?.coingeckoId || null,
        icon_url: `/coins/${symbol}.png`,
      });
    }

    console.log(`[MasterSymbols] Upserting ${masterSymbols.length} symbols...`);

    // Batch upsert master symbols
    for (let i = 0; i < masterSymbols.length; i += 100) {
      const batch = masterSymbols.slice(i, i + 100);
      const { error, status } = await supabase
        .from('master_symbols')
        .upsert(batch, { onConflict: 'base_symbol' });
      
      if (error) {
        console.error(`[MasterSymbols] Batch ${i/100} error (${status}):`, error);
      } else {
        console.log(`[MasterSymbols] Batch ${i/100} upserted ${batch.length} symbols`);
      }
    }

    console.log('[MasterSymbols] Master symbols initialized successfully!');
  } catch (error) {
    console.error('[MasterSymbols] Initialization failed:', error);
    process.exit(1);
  }
}

initializeMasterSymbols().then(() => {
  console.log('[MasterSymbols] Done');
  process.exit(0);
}).catch((error) => {
  console.error('[MasterSymbols] Error:', error);
  process.exit(1);
});

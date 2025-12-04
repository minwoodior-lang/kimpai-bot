import { createClient } from "@supabase/supabase-js";
import { fetchUpbitMarkets } from "./coinMetadata";

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
    const { metadata } = await fetchUpbitMarkets();
    if (!metadata || metadata.size === 0) {
      throw new Error('Failed to fetch Upbit markets');
    }

    // Prepare master symbols data
    const masterSymbols: MasterSymbol[] = [];
    const metadataArray = Array.from(metadata.entries());
    
    for (const [symbol, coinMeta] of metadataArray) {
      masterSymbols.push({
        base_symbol: symbol,
        ko_name: coinMeta.koreanName || null,
        coingecko_id: null,
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

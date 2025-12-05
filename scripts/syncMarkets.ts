import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 자동 상장 수집 크론 작업
 * 순서: syncUpbitNames → syncBithumbNames → syncCoinoneNames → buildMasterSymbols → buildPremiumTable
 */
async function runSync(): Promise<void> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`\n[AutoSync] Starting at ${timestamp}`);
    console.log('[AutoSync] Step 1/5: Syncing Upbit markets...');
    await execAsync('npm run fetch:upbit');
    
    console.log('[AutoSync] Step 2/5: Syncing Bithumb markets...');
    await execAsync('npm run fetch:bithumb');
    
    console.log('[AutoSync] Step 3/5: Syncing Coinone markets...');
    await execAsync('npm run fetch:coinone');
    
    console.log('[AutoSync] Step 4/5: Merging markets...');
    await execAsync('npm run build:markets');
    
    console.log('[AutoSync] Step 5/5: Updating master symbols...');
    await execAsync('npm run build:master-symbols');
    
    console.log('[AutoSync] Building premium table...');
    await execAsync('npm run build:premium');
    
    console.log(`[AutoSync] ✓ Completed successfully at ${new Date().toISOString()}`);
  } catch (err: any) {
    const errorMsg = err?.message || 'Unknown error';
    console.error(`[AutoSync] ✗ Failed at ${new Date().toISOString()}`);
    console.error(`[AutoSync] Error: ${errorMsg}`);
    console.error(`[AutoSync] stdout: ${err?.stdout || 'N/A'}`);
    console.error(`[AutoSync] stderr: ${err?.stderr || 'N/A'}`);
  }
}

// Main execution
if (require.main === module) {
  runSync().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('[AutoSync] Fatal error:', err);
    process.exit(1);
  });
}

export { runSync };

/**
 * master_symbols 자동 업데이트 로직
 * 크롤린 공지 데이터로 한글명 저장
 * 
 * ⚠️ SERVER-ONLY: scripts/ 및 API routes에서만 사용 가능
 */

import { createClient } from '@supabase/supabase-js';

// 브라우저 컨텍스트에서 로드되지 않도록 strict guard
if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
  throw new Error('[UpdateMasterSymbols] Server-only module. Cannot run in browser context.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('[UpdateMasterSymbols] Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 심볼 정규화
 * KRW-PIEVERSE, PIEVERSE/KRW, PIEVERSE 등 다양한 형식을 base_symbol으로 통일
 */
function normalizeBaseSymbol(raw: string): string {
  if (!raw) return '';
  
  // 구분자 제거 (-, /, _)
  let symbol = raw.replace(/[-/_]/g, '').toUpperCase();
  
  // 마켓 접미사 제거
  const marketSuffixes = ['KRW', 'USDT', 'BTC', 'ETH'];
  for (const suffix of marketSuffixes) {
    if (symbol.length > suffix.length && symbol.endsWith(suffix)) {
      symbol = symbol.slice(0, -suffix.length);
      break;
    }
  }
  
  return symbol.trim();
}

interface MasterSymbolRecord {
  base_symbol: string;
  ko_name: string;
  is_active: boolean;
}

/**
 * master_symbols에 한글명 업데이트 (upsert)
 * 1. 기존 ko_name이 있으면 유지 (기존 데이터 보호)
 * 2. 없으면 새로운 한글명 저장
 */
export async function upsertKoreanNameFromNotice(
  symbol: string,
  koName: string
): Promise<boolean> {
  try {
    const baseSymbol = normalizeBaseSymbol(symbol);
    if (!baseSymbol || !koName) {
      return false;
    }

    // 1. 기존 레코드 확인
    const { data: existing } = await supabase
      .from('master_symbols')
      .select('base_symbol, ko_name')
      .eq('base_symbol', baseSymbol)
      .single();

    // 2. 이미 한글명이 있으면 업데이트하지 않음 (기존 데이터 우선)
    if (existing?.ko_name && existing.ko_name.length > 0) {
      console.log(`[UpdateMasterSymbols] ${baseSymbol} already has ko_name: ${existing.ko_name}`);
      return false;
    }

    // 3. 없으면 새로운 한글명 저장
    const record: MasterSymbolRecord = {
      base_symbol: baseSymbol,
      ko_name: koName.trim(),
      is_active: true,
    };

    const { error } = await supabase
      .from('master_symbols')
      .upsert([record], { onConflict: 'base_symbol' });

    if (error) {
      console.error(`[UpdateMasterSymbols] Upsert error for ${baseSymbol}:`, error);
      return false;
    }

    console.log(`[UpdateMasterSymbols] Upserted: ${baseSymbol} = ${koName}`);
    return true;
  } catch (error) {
    console.error('[UpdateMasterSymbols] Error:', error);
    return false;
  }
}

/**
 * 여러 코인의 한글명 일괄 업데이트
 */
export async function batchUpsertKoreanNames(
  coins: Array<{ symbol: string; koName: string }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const coin of coins) {
    const result = await upsertKoreanNameFromNotice(coin.symbol, coin.koName);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(
    `[UpdateMasterSymbols] Batch complete: ${success} success, ${failed} failed`
  );

  return { success, failed };
}

/**
 * master_symbols에서 현재 저장된 한글명 개수 조회
 */
export async function countMasterSymbolsWithKoName(): Promise<number> {
  try {
    const { count } = await supabase
      .from('master_symbols')
      .select('*', { count: 'exact', head: true })
      .neq('ko_name', '')
      .neq('ko_name', null);

    return count || 0;
  } catch (error) {
    console.error('[UpdateMasterSymbols] Count error:', error);
    return 0;
  }
}

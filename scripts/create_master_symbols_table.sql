-- KimpAI master_symbols 테이블 생성
-- 모든 거래소의 심볼을 통일적으로 관리하기 위한 마스터 테이블
-- Supabase SQL Editor에서 실행해주세요

CREATE TABLE IF NOT EXISTS public.master_symbols (
  id BIGSERIAL PRIMARY KEY,
  base_symbol VARCHAR(20) NOT NULL UNIQUE,
  ko_name VARCHAR(100),
  coingecko_id VARCHAR(100),
  icon_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래소별 심볼 매핑 테이블 (base_symbol -> 거래소별 원본 심볼)
CREATE TABLE IF NOT EXISTS public.exchange_symbol_mappings (
  id BIGSERIAL PRIMARY KEY,
  base_symbol VARCHAR(20) NOT NULL,
  exchange_name VARCHAR(50) NOT NULL,
  exchange_symbol VARCHAR(50) NOT NULL,
  exchange_market VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (base_symbol) REFERENCES public.master_symbols(base_symbol) ON DELETE CASCADE,
  UNIQUE(base_symbol, exchange_name, exchange_market)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_master_symbols_base_symbol ON public.master_symbols(base_symbol);
CREATE INDEX IF NOT EXISTS idx_master_symbols_coingecko_id ON public.master_symbols(coingecko_id);
CREATE INDEX IF NOT EXISTS idx_master_symbols_is_active ON public.master_symbols(is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_symbol_mappings_base_symbol ON public.exchange_symbol_mappings(base_symbol);
CREATE INDEX IF NOT EXISTS idx_exchange_symbol_mappings_exchange ON public.exchange_symbol_mappings(exchange_name);

-- RLS 정책
ALTER TABLE public.master_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_symbol_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read master_symbols" ON public.master_symbols
  FOR SELECT USING (true);

CREATE POLICY "Allow service role manage master_symbols" ON public.master_symbols
  FOR ALL USING (true);

CREATE POLICY "Allow public read exchange_symbol_mappings" ON public.exchange_symbol_mappings
  FOR SELECT USING (true);

CREATE POLICY "Allow service role manage exchange_symbol_mappings" ON public.exchange_symbol_mappings
  FOR ALL USING (true);

-- 테이블 설명
COMMENT ON TABLE public.master_symbols IS 'Centralized cryptocurrency symbol management with bilingual names and icons';
COMMENT ON TABLE public.exchange_symbol_mappings IS 'Mapping between master_symbols and exchange-specific symbol representations';
COMMENT ON COLUMN public.master_symbols.base_symbol IS 'Primary symbol (BTC, ETH, XRP, etc.)';
COMMENT ON COLUMN public.master_symbols.ko_name IS 'Korean name (비트코인, 이더리움, etc.)';
COMMENT ON COLUMN public.master_symbols.icon_url IS 'Cached icon URL for this symbol';

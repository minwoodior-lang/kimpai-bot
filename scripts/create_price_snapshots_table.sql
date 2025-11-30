-- KimpAI price_snapshots 테이블 생성
-- Supabase SQL Editor에서 실행해주세요

CREATE TABLE IF NOT EXISTS public.price_snapshots (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  upbit_price DECIMAL(20, 8) NOT NULL,
  binance_price_usd DECIMAL(20, 8) NOT NULL,
  fx_rate DECIMAL(10, 4) NOT NULL,
  premium DECIMAL(10, 4) NOT NULL,
  volume_24h BIGINT,
  change_24h DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol ON public.price_snapshots(symbol);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_created_at ON public.price_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol_created ON public.price_snapshots(symbol, created_at DESC);

-- RLS 정책 (읽기 허용)
ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.price_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Allow service role insert" ON public.price_snapshots
  FOR INSERT WITH CHECK (true);

-- 오래된 스냅샷 정리 함수 (선택사항)
-- 7일 이상 된 데이터 삭제
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM public.price_snapshots
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.price_snapshots IS 'Real-time cryptocurrency price snapshots for Kimchi Premium calculation';

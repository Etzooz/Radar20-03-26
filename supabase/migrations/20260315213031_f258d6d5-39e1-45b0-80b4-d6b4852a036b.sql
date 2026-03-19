
CREATE TABLE public.oracle_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  asset TEXT NOT NULL,
  price_at_snapshot DECIMAL NOT NULL,
  oracle_probability DECIMAL NOT NULL,
  market_probability DECIMAL,
  edge DECIMAL,
  confidence_score DECIMAL NOT NULL,
  active_sources INTEGER NOT NULL DEFAULT 0,
  total_sources INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_oracle_snapshots_asset_time ON public.oracle_snapshots(asset, created_at DESC);

ALTER TABLE public.oracle_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert snapshots"
  ON public.oracle_snapshots FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Anyone can read snapshots"
  ON public.oracle_snapshots FOR SELECT
  TO anon, authenticated
  USING (true);

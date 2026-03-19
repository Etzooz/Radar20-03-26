import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch latest market data from our own edge function
    const marketDataUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/market-data`;
    const res = await fetch(marketDataUrl, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`market-data returned ${res.status}`);
    }

    const data = await res.json();

    const ASSET_MAP: Record<string, { priceKey: string; confKey: string }> = {
      BTC: { priceKey: 'btc', confKey: 'btcConfidence' },
      SPX: { priceKey: 'sp500', confKey: 'sp500Confidence' },
      XAU: { priceKey: 'gold', confKey: 'goldConfidence' },
      OIL: { priceKey: 'oil', confKey: 'oilConfidence' },
    };

    const rows = [];
    for (const [asset, map] of Object.entries(ASSET_MAP)) {
      const price = data.prices?.[map.priceKey]?.current;
      const confidence = data.prediction?.[map.confKey];
      const mktProb = data.marketProbability?.[map.priceKey];
      const oracleProb = confidence ? confidence / 100 : 0.5;
      const edge = mktProb != null ? oracleProb - mktProb : null;

      if (price != null && confidence != null) {
        rows.push({
          asset,
          price_at_snapshot: price,
          oracle_probability: oracleProb,
          market_probability: mktProb ?? null,
          edge,
          confidence_score: confidence,
          active_sources: data.dataQuality?.availableSources || 0,
          total_sources: data.dataQuality?.totalSources || 0,
        });
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('oracle_snapshots').insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ saved: rows.length, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Snapshot save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save snapshot' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

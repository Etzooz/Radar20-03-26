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

    // Total predictions count
    const { count: totalPredictions } = await supabase
      .from('oracle_snapshots')
      .select('*', { count: 'exact', head: true });

    // Get all snapshots for stats
    const { data: allSnapshots } = await supabase
      .from('oracle_snapshots')
      .select('asset, oracle_probability, market_probability, edge, confidence_score, created_at')
      .order('created_at', { ascending: true });

    const snapshots = allSnapshots || [];

    // Average edge across all assets
    const edgeValues = snapshots.filter(s => s.edge !== null).map(s => Number(s.edge));
    const avgEdge = edgeValues.length > 0
      ? Math.round(edgeValues.reduce((a, b) => a + b, 0) / edgeValues.length * 1000) / 1000
      : 0;

    // Overall accuracy placeholder (based on direction correctness would need current prices)
    const avgConfidence = snapshots.length > 0
      ? Math.round(snapshots.reduce((s, snap) => s + Number(snap.confidence_score), 0) / snapshots.length)
      : 0;

    // Confidence trend (last 30 data points grouped by hour)
    const confidenceTrend: { timestamp: string; confidence: number; asset: string }[] = [];
    const recentSnapshots = snapshots.slice(-200);
    for (const snap of recentSnapshots) {
      confidenceTrend.push({
        timestamp: snap.created_at,
        confidence: Number(snap.confidence_score),
        asset: snap.asset,
      });
    }

    // Per-asset stats
    const assetStats: Record<string, { predictions: number; avgEdge: number; avgConfidence: number }> = {};
    const assets = ['BTC', 'SPX', 'XAU', 'OIL'];
    for (const asset of assets) {
      const assetSnaps = snapshots.filter(s => s.asset === asset);
      const edges = assetSnaps.filter(s => s.edge !== null).map(s => Number(s.edge));
      assetStats[asset] = {
        predictions: assetSnaps.length,
        avgEdge: edges.length > 0 ? Math.round(edges.reduce((a, b) => a + b, 0) / edges.length * 1000) / 1000 : 0,
        avgConfidence: assetSnaps.length > 0
          ? Math.round(assetSnaps.reduce((s, snap) => s + Number(snap.confidence_score), 0) / assetSnaps.length)
          : 0,
      };
    }

    return new Response(JSON.stringify({
      totalPredictions: totalPredictions || 0,
      avgEdge,
      avgConfidence,
      confidenceTrend,
      assetStats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Performance calculation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate performance' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

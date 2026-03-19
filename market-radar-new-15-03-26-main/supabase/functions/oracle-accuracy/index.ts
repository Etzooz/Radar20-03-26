import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TIMEFRAMES: Record<string, number> = {
  '1H': 1,
  '3H': 3,
  '6H': 6,
  '12H': 12,
  '3D': 72,
  '7D': 168,
};

const MIN_PREDICTIONS = 50;
const MAX_PREDICTIONS = 200;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const asset = url.searchParams.get('asset')?.toUpperCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch current prices for evaluation
    const currentPrices: Record<string, number> = {};

    // BTC from CoinGecko
    try {
      const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (priceRes.ok) {
        const pd = await priceRes.json();
        currentPrices['BTC'] = pd.bitcoin?.usd || 0;
        console.log(`[accuracy] BTC current price: $${currentPrices['BTC']}`);
      }
    } catch (e) { console.error('[accuracy] BTC price fetch failed:', e); }

    // SPX, XAU, OIL from Yahoo
    const yahooAssets = [
      { key: 'SPX', symbol: '^GSPC' },
      { key: 'XAU', symbol: 'GC=F' },
      { key: 'OIL', symbol: 'CL=F' },
    ];
    for (const a of yahooAssets) {
      try {
        const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${a.symbol}?range=1d&interval=1d`);
        if (r.ok) {
          const d = await r.json();
          const price = d.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price) {
            currentPrices[a.key] = price;
            console.log(`[accuracy] ${a.key} current price: $${price}`);
          }
        }
      } catch (e) { console.error(`[accuracy] ${a.key} price fetch failed:`, e); }
    }

    const assetsToQuery = asset ? [asset] : ['BTC', 'SPX', 'XAU', 'OIL'];
    const result: Record<string, Record<string, number | string>> = {};

    for (const a of assetsToQuery) {
      result[a] = {};
      const currentPrice = currentPrices[a] || 0;

      if (currentPrice === 0) {
        console.warn(`[accuracy] No current price for ${a}, marking all timeframes insufficient`);
        for (const tfLabel of Object.keys(TIMEFRAMES)) {
          result[a][tfLabel] = 'insufficient';
        }
        continue;
      }

      // Fetch last MAX_PREDICTIONS snapshots for this asset
      const { data: allSnapshots, error: fetchErr } = await supabase
        .from('oracle_snapshots')
        .select('created_at, price_at_snapshot, oracle_probability')
        .eq('asset', a)
        .order('created_at', { ascending: false })
        .limit(MAX_PREDICTIONS);

      if (fetchErr || !allSnapshots) {
        console.error(`[accuracy] DB fetch error for ${a}:`, fetchErr);
        for (const tfLabel of Object.keys(TIMEFRAMES)) {
          result[a][tfLabel] = 'insufficient';
        }
        continue;
      }

      console.log(`[accuracy] ${a}: ${allSnapshots.length} total snapshots available`);

      for (const [tfLabel, hours] of Object.entries(TIMEFRAMES)) {
        const cutoffMs = hours * 60 * 60 * 1000;
        const now = Date.now();

        // Only evaluate snapshots old enough for this timeframe
        const eligibleSnapshots = allSnapshots.filter(s => {
          const age = now - new Date(s.created_at).getTime();
          return age >= cutoffMs;
        });

        if (eligibleSnapshots.length < MIN_PREDICTIONS) {
          // Not enough data for reliable accuracy
          result[a][tfLabel] = 'insufficient';
          console.log(`[accuracy] ${a} ${tfLabel}: insufficient data (${eligibleSnapshots.length}/${MIN_PREDICTIONS} needed)`);
          continue;
        }

        // Evaluate directional accuracy:
        // BULLISH prediction (probability > 0.5) → price should have gone UP from snapshot price
        // BEARISH prediction (probability <= 0.5) → price should have gone DOWN from snapshot price
        let correct = 0;
        for (const snap of eligibleSnapshots) {
          const predictedBullish = Number(snap.oracle_probability) > 0.5;
          const actualBullish = currentPrice > Number(snap.price_at_snapshot);
          if (predictedBullish === actualBullish) correct++;
        }

        const accuracy = Math.round((correct / eligibleSnapshots.length) * 100);
        result[a][tfLabel] = accuracy / 100; // Return as 0-1 for frontend
        console.log(`[accuracy] ${a} ${tfLabel}: ${accuracy}% (${correct}/${eligibleSnapshots.length})`);
      }
    }

    // Fetch total prediction count per asset
    const predictionCounts: Record<string, number> = {};
    for (const a of assetsToQuery) {
      const { count } = await supabase
        .from('oracle_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('asset', a);
      predictionCounts[a] = count || 0;
    }

    // Calculate reliability per asset
    const reliability: Record<string, { level: string; totalPredictions: number; bestAccuracy: number }> = {};
    for (const a of assetsToQuery) {
      const accuracies = Object.values(result[a])
        .filter((v): v is number => typeof v === 'number');

      const predCount = predictionCounts[a] || 0;
      const bestAccuracy = accuracies.length > 0 ? Math.max(...accuracies) * 100 : 0;

      let level = 'LOW';
      if (bestAccuracy > 75 && predCount >= 200) level = 'HIGH';
      else if (bestAccuracy >= 60 && predCount >= 100) level = 'MEDIUM';

      reliability[a] = { level, totalPredictions: predCount, bestAccuracy: Math.round(bestAccuracy) };
    }

    const responseBody = {
      accuracy: asset ? result[asset] : result,
      reliability,
      predictionCounts,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[accuracy] Calculation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate accuracy' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

Design system: dark financial dashboard (MarketRadar/ORACLE)
Fonts: Space Grotesk (display), JetBrains Mono (data)
Semantic colors: --bullish (green), --bearish (red), --neutral (yellow), --confidence (blue), --gauge-bg
Components: AccessibilityWrapper, ForecastCard, FearGreedGauge, GlobalMarketPulse, ConfidenceScore, AIPerformance, Heatmap, HistoryChart, LiquidityShockAlert, SourceBadge, DataStatusBanner
Edge functions: market-data (quant-ensemble-v6 prediction engine), oracle-accuracy, oracle-performance, oracle-snapshot
Prediction engine v6.1: all API fetches use fetchWithTimeout (5s), response validation, ONLINE/OFFLINE status tracking
Dead APIs removed: CryptoPanic (404), LunarCrush (402 paid)
DB table: oracle_snapshots (asset, price_at_snapshot, oracle_probability, market_probability, edge, confidence_score, active_sources, total_sources)
Routes: / (dashboard), /performance (historical accuracy engine)
Supabase project ID: czxjtawtxjwunllwfwxy
Heatmap shows "pending" state when <10 snapshots per timeframe
Reliability tag: HIGH if >75% acc AND >=200 preds, MEDIUM if >=60% acc AND >=100 preds, LOW otherwise
DataStatusReport: ONLINE/OFFLINE with indicatorsActive, tradingSignalsEnabled, failedSources, logs

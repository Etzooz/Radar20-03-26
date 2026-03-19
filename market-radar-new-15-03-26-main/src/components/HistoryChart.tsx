import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface HistoryPoint {
  date: string;
  bitcoin: number;
  sp500: number;
}

export const HistoryChart = ({ data }: { data: HistoryPoint[] }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="text-foreground font-semibold text-lg flex items-center gap-2 mb-4">
        <span>📈</span> 7-Day Fear & Greed History
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
          <XAxis
            dataKey="date"
            stroke="hsl(215 15% 50%)"
            fontSize={11}
            fontFamily="JetBrains Mono"
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="hsl(215 15% 50%)"
            fontSize={11}
            fontFamily="JetBrains Mono"
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220 18% 10%)",
              border: "1px solid hsl(220 15% 16%)",
              borderRadius: "8px",
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(210 20% 92%)" }}
          />
          <Legend
            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="bitcoin"
            stroke="hsl(25 95% 55%)"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(25 95% 55%)" }}
            name="Bitcoin"
          />
          <Line
            type="monotone"
            dataKey="sp500"
            stroke="hsl(160 60% 45%)"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(160 60% 45%)" }}
            name="S&P 500"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

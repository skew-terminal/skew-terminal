import { useState } from "react";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Mock price data
const chartData = [
  { time: "00:00", price: 0.52, volume: 12000 },
  { time: "02:00", price: 0.54, volume: 15000 },
  { time: "04:00", price: 0.53, volume: 8000 },
  { time: "06:00", price: 0.56, volume: 22000 },
  { time: "08:00", price: 0.58, volume: 35000 },
  { time: "10:00", price: 0.55, volume: 18000 },
  { time: "12:00", price: 0.59, volume: 28000 },
  { time: "14:00", price: 0.61, volume: 42000 },
  { time: "16:00", price: 0.60, volume: 31000 },
  { time: "18:00", price: 0.62, volume: 38000 },
  { time: "20:00", price: 0.61, volume: 25000 },
  { time: "22:00", price: 0.61, volume: 20000 },
];

export const MainChart = () => {
  const [timeframe, setTimeframe] = useState("1D");
  const currentPrice = 0.61;
  const priceChange = +17.3;

  return (
    <div className="flex h-full flex-col border-b border-border">
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold text-foreground">
                TRUMP 2024 VICTORY
              </span>
              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                POLYMARKET
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xl font-bold text-foreground">
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`flex items-center gap-1 font-mono text-sm ${priceChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {priceChange >= 0 ? '+' : ''}{priceChange}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1">
          {["1H", "4H", "1D", "1W", "1M"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 font-mono text-xs transition-all ${
                timeframe === tf
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
          <button className="ml-2 p-1 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(110, 100%, 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(110, 100%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              dy={10}
            />
            <YAxis
              domain={['dataMin - 0.02', 'dataMax + 0.02']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              dx={-10}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 4%)',
                border: '1px solid hsl(0, 0%, 15%)',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(0, 0%, 60%)' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(110, 100%, 55%)"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

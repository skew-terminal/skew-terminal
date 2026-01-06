import { Flame, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface HotOpportunity {
  id: string;
  market: string;
  skew: number;
  trend: "up" | "down";
  sparkline: number[];
}

const hotOpportunities: HotOpportunity[] = [
  { id: "btc-100k-dec", market: "BTC > $100k", skew: 14.8, trend: "up", sparkline: [45, 52, 48, 60, 55, 68, 62, 75] },
  { id: "trump-2024", market: "Trump 2024", skew: 11.5, trend: "up", sparkline: [50, 55, 58, 52, 60, 65, 62, 68] },
  { id: "biden-drop", market: "Biden Drops", skew: 33.3, trend: "up", sparkline: [10, 15, 12, 18, 25, 22, 28, 33] },
  { id: "eth-5k-q1", market: "ETH > $5k", skew: 12.0, trend: "down", sparkline: [40, 38, 42, 35, 38, 32, 35, 28] },
  { id: "fed-rate-jan", market: "Fed Rate Cut", skew: 9.4, trend: "up", sparkline: [30, 32, 35, 38, 42, 40, 45, 48] },
];

export const HotTicker = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-10 items-center gap-1 overflow-hidden border-b border-border bg-card/50 px-2">
      {/* Label */}
      <div className="flex shrink-0 items-center gap-1.5 border-r border-border pr-3">
        <Flame className="h-3.5 w-3.5 text-primary animate-pulse" />
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-primary">
          HOT
        </span>
      </div>

      {/* Scrolling Ticker */}
      <div className="flex flex-1 items-center gap-3 overflow-x-auto scrollbar-hide">
        {hotOpportunities.map((opp) => (
          <button
            key={opp.id}
            onClick={() => navigate(`/event/${opp.id}`)}
            className="flex shrink-0 items-center gap-2 rounded-sm border border-border bg-secondary/30 px-2 py-1 transition-all hover:border-primary/50 hover:bg-secondary/60"
          >
            {/* Sparkline Chart */}
            <div className="h-5 w-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={opp.sparkline.map((v, i) => ({ v }))}>
                  <defs>
                    <linearGradient id={`gradient-${opp.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={opp.trend === "up" ? "hsl(110, 100%, 55%)" : "hsl(16, 100%, 50%)"}
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="100%"
                        stopColor={opp.trend === "up" ? "hsl(110, 100%, 55%)" : "hsl(16, 100%, 50%)"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={opp.trend === "up" ? "hsl(110, 100%, 55%)" : "hsl(16, 100%, 50%)"}
                    strokeWidth={1}
                    fill={`url(#gradient-${opp.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Market Info */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-foreground">
                {opp.market}
              </span>
              <span className="font-mono text-[10px] font-bold text-accent">
                +{opp.skew.toFixed(1)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

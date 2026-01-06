import { Flame, TrendingUp, ExternalLink, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { FooterBar } from "@/components/terminal/FooterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HotOpportunity {
  id: string;
  market: string;
  category: "crypto" | "politics" | "sports" | "economics";
  polyPrice: number;
  kalshiPrice: number;
  skew: number;
  trend: "up" | "down";
  volume24h: string;
  sparkline: number[];
  resolutionDate: string;
  isNew: boolean;
}

const hotOpportunities: HotOpportunity[] = [
  {
    id: "biden-drop",
    market: "Biden Drops Out Before Convention",
    category: "politics",
    polyPrice: 33,
    kalshiPrice: 28,
    skew: 17.8,
    trend: "up",
    volume24h: "$2.4M",
    sparkline: [10, 15, 12, 18, 25, 22, 28, 33, 30, 35, 32, 38],
    resolutionDate: "Aug 19, 2024",
    isNew: true,
  },
  {
    id: "btc-100k-dec",
    market: "BTC > $100k by Dec 2024",
    category: "crypto",
    polyPrice: 42,
    kalshiPrice: 35,
    skew: 20.0,
    trend: "up",
    volume24h: "$5.1M",
    sparkline: [30, 32, 35, 40, 38, 42, 45, 48, 50, 52, 48, 55],
    resolutionDate: "Dec 31, 2024",
    isNew: false,
  },
  {
    id: "trump-2024",
    market: "Trump Wins 2024 Election",
    category: "politics",
    polyPrice: 52,
    kalshiPrice: 45,
    skew: 15.5,
    trend: "up",
    volume24h: "$12.3M",
    sparkline: [45, 48, 46, 50, 52, 48, 55, 58, 52, 56, 54, 58],
    resolutionDate: "Nov 5, 2024",
    isNew: false,
  },
  {
    id: "eth-5k-q1",
    market: "ETH > $5k Q1 2025",
    category: "crypto",
    polyPrice: 28,
    kalshiPrice: 22,
    skew: 27.2,
    trend: "up",
    volume24h: "$1.8M",
    sparkline: [15, 18, 20, 22, 25, 28, 26, 30, 28, 32, 30, 35],
    resolutionDate: "Mar 31, 2025",
    isNew: true,
  },
  {
    id: "fed-rate-jan",
    market: "Fed Rate Cut in January",
    category: "economics",
    polyPrice: 65,
    kalshiPrice: 58,
    skew: 12.0,
    trend: "down",
    volume24h: "$3.2M",
    sparkline: [70, 68, 72, 65, 68, 62, 65, 60, 63, 58, 62, 55],
    resolutionDate: "Jan 31, 2025",
    isNew: false,
  },
  {
    id: "superbowl-kc",
    market: "Chiefs Win Super Bowl",
    category: "sports",
    polyPrice: 18,
    kalshiPrice: 12,
    skew: 50.0,
    trend: "up",
    volume24h: "$890K",
    sparkline: [8, 10, 12, 14, 16, 15, 18, 20, 18, 22, 20, 24],
    resolutionDate: "Feb 9, 2025",
    isNew: true,
  },
];

const categoryColors: Record<string, string> = {
  crypto: "bg-accent/20 text-accent border-accent/30",
  politics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sports: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  economics: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const HotDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopNavBar />

      <div className="flex flex-1 overflow-hidden">
        <IconSidebar />

        <main className="flex-1 overflow-auto p-4">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/20">
                <Flame className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="font-mono text-lg font-bold text-foreground">HOT OPPORTUNITIES</h1>
                <p className="font-mono text-xs text-muted-foreground">
                  High-skew events with maximum profit potential
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-accent/50 text-accent font-mono text-xs">
                <Zap className="mr-1 h-3 w-3" />
                {hotOpportunities.length} Active
              </Badge>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hotOpportunities
              .sort((a, b) => b.skew - a.skew)
              .map((opp) => (
                <Card
                  key={opp.id}
                  className="group cursor-pointer border-border bg-card/50 transition-all hover:border-primary/50 hover:bg-card"
                  onClick={() => navigate(`/event/${opp.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${categoryColors[opp.category]} border px-1.5 py-0 font-mono text-[9px] uppercase`}
                          >
                            {opp.category}
                          </Badge>
                          {opp.isNew && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 px-1.5 py-0 font-mono text-[9px]">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-mono text-sm font-medium text-foreground leading-tight">
                          {opp.market}
                        </h3>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to watchlist
                        }}
                      >
                        <Star className="h-4 w-4 text-muted-foreground hover:text-accent" />
                      </button>
                    </div>

                    {/* Sparkline Chart */}
                    <div className="h-20 w-full mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={opp.sparkline.map((v, i) => ({ v }))}>
                          <defs>
                            <linearGradient id={`hot-gradient-${opp.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor={opp.trend === "up" ? "hsl(110, 100%, 55%)" : "hsl(16, 100%, 50%)"}
                                stopOpacity={0.4}
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
                            strokeWidth={1.5}
                            fill={`url(#hot-gradient-${opp.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Skew Display */}
                    <div className="mb-3 flex items-center justify-between rounded-sm bg-accent/10 p-2 border border-accent/20">
                      <span className="font-mono text-xs text-muted-foreground">SKEW</span>
                      <span className="font-mono text-xl font-bold text-accent">
                        +{opp.skew.toFixed(1)}%
                      </span>
                    </div>

                    {/* Price Comparison */}
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="rounded-sm bg-secondary/50 p-2">
                        <div className="font-mono text-[9px] text-muted-foreground uppercase">Polymarket</div>
                        <div className="font-mono text-sm font-bold text-foreground">{opp.polyPrice}¢</div>
                      </div>
                      <div className="rounded-sm bg-secondary/50 p-2">
                        <div className="font-mono text-[9px] text-muted-foreground uppercase">Kalshi</div>
                        <div className="font-mono text-sm font-bold text-foreground">{opp.kalshiPrice}¢</div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mb-3 flex items-center justify-between text-xs">
                      <div className="font-mono text-muted-foreground">
                        Vol: <span className="text-foreground">{opp.volume24h}</span>
                      </div>
                      <div className="font-mono text-muted-foreground">
                        Resolves: <span className="text-foreground">{opp.resolutionDate}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-accent hover:bg-accent/80 text-background font-mono text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://polymarket.com`, "_blank");
                        }}
                      >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        BUY POLY
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-primary/50 text-primary hover:bg-primary/10 font-mono text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://kalshi.com`, "_blank");
                        }}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        SELL KALSHI
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </main>
      </div>

      <FooterBar />
    </div>
  );
};

export default HotDashboard;

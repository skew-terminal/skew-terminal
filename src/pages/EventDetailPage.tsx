import { useParams, useNavigate } from "react-router-dom";
import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock price history
const priceData = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}d`,
  poly: 0.45 + Math.random() * 0.2,
  kalshi: 0.42 + Math.random() * 0.18,
}));

// Mock volume data
const volumeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  buy: Math.floor(Math.random() * 50000),
  sell: Math.floor(Math.random() * 40000),
}));

const mockEvent = {
  id: "btc-100k-dec",
  market: "Bitcoin > $100k (Dec)",
  category: "crypto",
  polyPrice: 0.62,
  kalshiPrice: 0.54,
  skew: 14.8,
  volume24h: 1240000,
  totalVolume: 8500000,
  participants: 4521,
  resolution: "Dec 31, 2024",
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <TopNavBar />
      
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/app")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-mono text-xs font-bold text-foreground">
                {mockEvent.market}
              </span>
              <Badge variant="outline" className="border-accent/50 text-accent font-mono text-[8px] px-1 py-0">
                +{mockEvent.skew.toFixed(1)}% SKEW
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  Resolves: {mockEvent.resolution}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Chart Area (60%) */}
            <div className="flex w-[60%] flex-col border-r border-border/50">
              {/* Price Chart */}
              <div className="flex-1 border-b border-border/50 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Price History
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-mono text-[9px] text-muted-foreground">Polymarket</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <span className="font-mono text-[9px] text-muted-foreground">Kalshi</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={priceData}>
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0.3, 0.8]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <Area type="monotone" dataKey="poly" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="kalshi" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.1)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              <div className="h-[35%] p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Smart Money Delta (24H)
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <span className="font-mono text-[9px] text-muted-foreground">Buying</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-mono text-[9px] text-muted-foreground">Selling</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={volumeData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Bar dataKey="buy" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="sell" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Data Panels (40%) */}
            <div className="flex w-[40%] flex-col">
              {/* Price Comparison */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live Prices
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <span className="font-mono text-[9px] text-muted-foreground">POLYMARKET</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-mono text-lg font-bold text-foreground">
                        ${mockEvent.polyPrice.toFixed(2)}
                      </span>
                      <TrendingUp className="h-3 w-3 text-accent" />
                    </div>
                  </div>
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <span className="font-mono text-[9px] text-muted-foreground">KALSHI</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-mono text-lg font-bold text-foreground">
                        ${mockEvent.kalshiPrice.toFixed(2)}
                      </span>
                      <TrendingDown className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Arbitrage Box */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Arbitrage Opportunity
                </span>
                <div className="mt-2 rounded-sm bg-accent/10 border border-accent/30 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">SKEW</span>
                    <span className="font-mono text-xl font-bold text-accent">
                      +{mockEvent.skew.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button className="flex-1 h-7 bg-accent hover:bg-accent/80 text-accent-foreground font-mono text-[10px]">
                      BUY POLY
                    </Button>
                    <Button className="flex-1 h-7 bg-primary hover:bg-primary/80 text-primary-foreground font-mono text-[10px]">
                      SELL KALSHI
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Market Stats
                </span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">24H Volume</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      ${(mockEvent.volume24h / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">Total Volume</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      ${(mockEvent.totalVolume / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">Participants</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      {mockEvent.participants.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="flex-1 overflow-auto p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Trades
                </span>
                <div className="mt-2 space-y-1">
                  {[
                    { time: "14:02:35", side: "buy", size: 15000, platform: "POLY" },
                    { time: "14:01:22", side: "sell", size: 8000, platform: "KALSHI" },
                    { time: "13:58:11", side: "buy", size: 25000, platform: "POLY" },
                    { time: "13:55:44", side: "buy", size: 5000, platform: "KALSHI" },
                    { time: "13:52:18", side: "sell", size: 12000, platform: "POLY" },
                  ].map((trade, i) => (
                    <div key={i} className="flex items-center justify-between rounded-sm border border-border/30 bg-card/50 px-2 py-1">
                      <span className="font-mono text-[9px] text-muted-foreground">{trade.time}</span>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[7px] px-1 py-0 ${
                          trade.side === "buy" ? "border-accent/50 text-accent" : "border-primary/50 text-primary"
                        }`}
                      >
                        {trade.side.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">{trade.platform}</span>
                      <span className={`font-mono text-[10px] font-bold ${trade.side === "buy" ? "text-accent" : "text-primary"}`}>
                        ${(trade.size / 1000).toFixed(0)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

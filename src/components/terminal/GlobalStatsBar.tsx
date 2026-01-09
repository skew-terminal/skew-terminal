import { TrendingUp, BarChart3, Zap, Activity } from "lucide-react";
import { useTerminalStats } from "@/hooks/useGroupedMarkets";

export const GlobalStatsBar = () => {
  const { data: stats, isLoading } = useTerminalStats();

  const formatVolume = (vol: number) => {
    if (vol >= 1000000000) return `$${(vol / 1000000000).toFixed(1)}B`;
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const statsItems = [
    { 
      label: "24h Volume", 
      value: isLoading ? "..." : formatVolume(stats?.totalVolume24h || 0),
      icon: TrendingUp,
      highlight: true
    },
    { 
      label: "Markets", 
      value: isLoading ? "..." : stats?.totalMarkets?.toLocaleString() || "0",
      icon: BarChart3,
      highlight: false
    },
    { 
      label: "Arbitrage", 
      value: isLoading ? "..." : stats?.arbitrageCount?.toString() || "0",
      icon: Zap,
      highlight: (stats?.arbitrageCount || 0) > 0
    },
  ];

  return (
    <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-1.5">
      <div className="flex items-center gap-6">
        {statsItems.map((stat, index) => (
          <div key={index} className="flex items-center gap-2">
            <stat.icon className={`h-3.5 w-3.5 ${stat.highlight ? "text-accent" : "text-muted-foreground"}`} />
            <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
              {stat.label}:
            </span>
            <span className={`font-mono text-xs font-bold ${stat.highlight ? "text-accent" : "text-foreground"}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[9px] text-muted-foreground">19 PLATFORMS</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="font-mono text-[10px] font-medium text-accent">LIVE</span>
        </div>
      </div>
    </div>
  );
};

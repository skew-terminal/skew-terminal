import { Activity, Database, Clock, Wifi, WifiOff } from "lucide-react";

interface FooterStats {
  totalVolume: string;
  activeArbs: number;
  avgSpread: string;
  lastUpdate: string;
  apiStatus: "live" | "delayed" | "offline";
}

const stats: FooterStats = {
  totalVolume: "$142.5M",
  activeArbs: 23,
  avgSpread: "8.2%",
  lastUpdate: "2s ago",
  apiStatus: "live",
};

const apiStatusConfig = {
  live: { icon: Wifi, color: "text-accent", bg: "bg-accent", label: "API LIVE" },
  delayed: { icon: Wifi, color: "text-yellow-500", bg: "bg-yellow-500", label: "DELAYED" },
  offline: { icon: WifiOff, color: "text-destructive", bg: "bg-destructive", label: "OFFLINE" },
};

export const FooterBar = () => {
  const statusConfig = apiStatusConfig[stats.apiStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <footer className="flex h-7 items-center justify-between border-t border-border bg-card px-3">
      {/* Left Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Database className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[9px] text-muted-foreground">VOLUME:</span>
          <span className="font-mono text-[9px] font-bold text-foreground">{stats.totalVolume}</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-accent" />
          <span className="font-mono text-[9px] text-muted-foreground">ACTIVE ARBS:</span>
          <span className="font-mono text-[9px] font-bold text-accent">{stats.activeArbs}</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-muted-foreground">AVG SPREAD:</span>
          <span className="font-mono text-[9px] font-bold text-foreground">{stats.avgSpread}</span>
        </div>
      </div>

      {/* Right: API Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[9px] text-muted-foreground">
            Updated {stats.lastUpdate}
          </span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
            {stats.apiStatus === "live" && (
              <div className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-ping rounded-full ${statusConfig.bg} opacity-75`} />
            )}
          </div>
          <span className={`font-mono text-[9px] font-bold ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>
    </footer>
  );
};

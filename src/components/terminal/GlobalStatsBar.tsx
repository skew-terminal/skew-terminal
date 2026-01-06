import { Activity, TrendingUp, Fuel } from "lucide-react";

const stats = [
  { label: "Total Arb Volume", value: "$4.2M", icon: TrendingUp, trend: "+12%" },
  { label: "Active Spreads", value: "12", icon: Activity, trend: null },
  { label: "Gas", value: "Low", icon: Fuel, trend: null },
];

export const GlobalStatsBar = () => {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card/50 px-3 py-1">
      <div className="flex items-center gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <stat.icon className="h-3 w-3 text-muted-foreground" />
            <span className="font-sans text-[9px] uppercase tracking-wider text-muted-foreground">
              {stat.label}:
            </span>
            <span className="font-mono text-[11px] font-bold text-foreground">
              {stat.value}
            </span>
            {stat.trend && (
              <span className="font-mono text-[10px] text-accent">
                {stat.trend}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        <span className="font-mono text-[9px] text-accent">LIVE</span>
      </div>
    </div>
  );
};

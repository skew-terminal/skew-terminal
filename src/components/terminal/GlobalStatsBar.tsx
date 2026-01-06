import { Activity, TrendingUp, Fuel } from "lucide-react";

const stats = [
  { label: "Total Arb Volume", value: "$4.2M", icon: TrendingUp, trend: "+12%" },
  { label: "Active Spreads", value: "12", icon: Activity, trend: null },
  { label: "Gas", value: "Low", icon: Fuel, trend: null },
];

export const GlobalStatsBar = () => {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
      <div className="flex items-center gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-2">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
              {stat.label}:
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
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
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="font-mono text-[10px] text-accent">LIVE</span>
      </div>
    </div>
  );
};

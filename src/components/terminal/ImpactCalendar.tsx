import { useState, useEffect } from "react";
import { Clock, AlertTriangle, AlertCircle, Info, Timer, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CalendarEvent {
  id: string;
  time: string;
  event: string;
  impact: "high" | "medium" | "low";
  category: "economics" | "politics" | "crypto";
  countdown: number;
}

const events: CalendarEvent[] = [
  { id: "1", time: "14:00 UTC", event: "CPI Inflation Data Release", impact: "high", category: "economics", countdown: 9910 },
  { id: "2", time: "18:30 UTC", event: "Fed Interest Rate Decision", impact: "high", category: "economics", countdown: 26110 },
  { id: "3", time: "10:00 UTC", event: "NFP Employment Report", impact: "medium", category: "economics", countdown: 86400 },
  { id: "4", time: "All Day", event: "Trump Rally - Iowa", impact: "medium", category: "politics", countdown: 172800 },
  { id: "5", time: "09:00 UTC", event: "ECB Policy Statement", impact: "low", category: "economics", countdown: 259200 },
  { id: "6", time: "12:00 UTC", event: "ETH ETF Approval Decision", impact: "high", category: "crypto", countdown: 345600 },
];

const impactConfig = {
  high: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/20", label: "HIGH", border: "border-primary/50" },
  medium: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "MED", border: "border-yellow-500/50" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary", label: "LOW", border: "border-muted-foreground/30" },
};

const categoryColors = {
  economics: "border-l-blue-500",
  politics: "border-l-purple-500",
  crypto: "border-l-accent",
};

const formatCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const ImpactCalendar = () => {
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [filterImpact, setFilterImpact] = useState<"all" | "high">("all");

  useEffect(() => {
    const initial: Record<string, number> = {};
    events.forEach((e) => {
      initial[e.id] = e.countdown;
    });
    setCountdowns(initial);

    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = Math.max(0, prev[key] - 1);
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(
    (e) => filterImpact === "all" || e.impact === "high"
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-foreground">
            Impact Calendar
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterImpact("all")}
            className={`h-5 px-1.5 font-mono text-[8px] ${
              filterImpact === "all" ? "text-foreground bg-secondary" : "text-muted-foreground"
            }`}
          >
            ALL
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterImpact("high")}
            className={`h-5 px-1.5 font-mono text-[8px] ${
              filterImpact === "high" ? "text-primary bg-primary/10" : "text-muted-foreground"
            }`}
          >
            HIGH
          </Button>
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-auto">
        {filteredEvents.map((event, index) => {
          const config = impactConfig[event.impact];
          const Icon = config.icon;
          const countdown = countdowns[event.id] ?? event.countdown;

          return (
            <div
              key={event.id}
              className={`border-l-2 ${categoryColors[event.category]} px-2 py-1.5 transition-colors hover:bg-secondary/50 ${
                index % 2 === 1 ? "bg-white/[0.02]" : ""
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <div className={`mt-0.5 shrink-0 rounded-sm p-0.5 ${config.bg}`}>
                    <Icon className={`h-2.5 w-2.5 ${config.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-foreground truncate">
                      {event.event}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Clock className="h-2 w-2 text-muted-foreground" />
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {event.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <Badge
                    variant="outline"
                    className={`shrink-0 font-mono text-[7px] px-1 py-0 ${config.border} ${config.color}`}
                  >
                    {config.label}
                  </Badge>
                  <span
                    className={`font-mono text-[9px] font-bold ${
                      countdown < 3600 ? "text-primary animate-pulse" : "text-accent"
                    }`}
                  >
                    {formatCountdown(countdown)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-2 py-1">
        <Link 
          to="/app/calendar" 
          className="block w-full font-mono text-[9px] text-primary hover:text-primary/80 transition-colors text-center"
        >
          VIEW FULL CALENDAR →
        </Link>
      </div>
    </div>
  );
};

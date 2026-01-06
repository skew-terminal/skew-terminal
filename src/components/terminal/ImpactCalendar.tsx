import { useState, useEffect } from "react";
import { Clock, AlertTriangle, AlertCircle, Info, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  time: string;
  event: string;
  impact: "high" | "medium" | "low";
  countdown: number; // seconds from now
}

const events: CalendarEvent[] = [
  { id: "1", time: "14:00 UTC", event: "CPI Inflation Data Release", impact: "high", countdown: 9910 },
  { id: "2", time: "18:30 UTC", event: "Fed Interest Rate Decision", impact: "high", countdown: 26110 },
  { id: "3", time: "10:00 UTC", event: "NFP Employment Report", impact: "medium", countdown: 86400 },
  { id: "4", time: "All Day", event: "Trump Rally - Iowa", impact: "medium", countdown: 172800 },
  { id: "5", time: "09:00 UTC", event: "ECB Policy Statement", impact: "low", countdown: 259200 },
];

const impactConfig = {
  high: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/20", label: "HIGH VOLATILITY", border: "border-primary/50" },
  medium: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "MEDIUM IMPACT", border: "border-yellow-500/50" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary", label: "LOW IMPACT", border: "border-muted-foreground/30" },
};

const formatCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  
  return `in ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const ImpactCalendar = () => {
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialize countdowns
    const initial: Record<string, number> = {};
    events.forEach((e) => {
      initial[e.id] = e.countdown;
    });
    setCountdowns(initial);

    // Update every second
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
        <span className="font-mono text-[9px] text-muted-foreground">
          CATALYSTS
        </span>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-auto">
        {events.map((event, index) => {
          const config = impactConfig[event.impact];
          const Icon = config.icon;
          const countdown = countdowns[event.id] ?? event.countdown;

          return (
            <div
              key={event.id}
              className={`px-2 py-1.5 transition-colors hover:bg-secondary/50 ${
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
                <Badge
                  variant="outline"
                  className={`shrink-0 font-mono text-[7px] px-1 py-0 ${config.border} ${config.color}`}
                >
                  {config.label}
                </Badge>
              </div>

              {/* Countdown */}
              <div className="mt-1 flex items-center justify-end">
                <span
                  className={`font-mono text-[9px] font-bold ${
                    countdown < 3600 ? "text-primary animate-pulse" : "text-accent"
                  }`}
                >
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-2 py-1">
        <a href="/app/calendar" className="block w-full font-mono text-[9px] text-primary hover:text-primary/80 transition-colors text-center">
          VIEW FULL CALENDAR →
        </a>
      </div>
    </div>
  );
};

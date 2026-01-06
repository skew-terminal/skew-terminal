import { Clock, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface CalendarEvent {
  date: string;
  time: string;
  event: string;
  impact: "high" | "medium" | "low";
}

const events: CalendarEvent[] = [
  { date: "Tomorrow", time: "14:00 UTC", event: "Fed Interest Rate Decision", impact: "high" },
  { date: "Jan 8", time: "10:00 UTC", event: "CPI Data Release", impact: "high" },
  { date: "Jan 10", time: "15:30 UTC", event: "NFP Employment Report", impact: "medium" },
  { date: "Jan 12", time: "All Day", event: "Trump Rally - Iowa", impact: "medium" },
  { date: "Jan 15", time: "09:00 UTC", event: "ECB Policy Statement", impact: "low" },
];

const impactConfig = {
  high: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/20" },
  medium: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary" },
};

export const EventCalendar = () => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
          Event Calendar
        </span>
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Events */}
      <div className="flex-1 overflow-auto">
        {events.map((event, index) => {
          const config = impactConfig[event.impact];
          const Icon = config.icon;

          return (
            <div
              key={index}
              className="border-b border-border px-3 py-2 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 rounded p-1 ${config.bg}`}>
                  <Icon className={`h-2.5 w-2.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-foreground truncate">
                    {event.event}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <button className="w-full font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
          VIEW FULL CALENDAR →
        </button>
      </div>
    </div>
  );
};

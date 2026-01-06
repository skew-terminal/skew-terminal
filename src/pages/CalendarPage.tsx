import { useState, useEffect } from "react";
import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { SearchModal } from "@/components/terminal/SearchModal";
import { Clock, AlertTriangle, AlertCircle, Info, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  event: string;
  category: "economic" | "political" | "crypto";
  impact: "high" | "medium" | "low";
  countdown: number;
}

const events: CalendarEvent[] = [
  { id: "1", date: "Today", time: "14:00 UTC", event: "CPI Inflation Data Release", category: "economic", impact: "high", countdown: 9910 },
  { id: "2", date: "Today", time: "18:30 UTC", event: "Fed Interest Rate Decision", category: "economic", impact: "high", countdown: 26110 },
  { id: "3", date: "Tomorrow", time: "10:00 UTC", event: "NFP Employment Report", category: "economic", impact: "medium", countdown: 86400 },
  { id: "4", date: "Tomorrow", time: "All Day", event: "Trump Rally - Iowa", category: "political", impact: "medium", countdown: 172800 },
  { id: "5", date: "Jan 8", time: "09:00 UTC", event: "ECB Policy Statement", category: "economic", impact: "low", countdown: 259200 },
  { id: "6", date: "Jan 8", time: "15:00 UTC", event: "Bitcoin ETF Decision Update", category: "crypto", impact: "high", countdown: 280800 },
  { id: "7", date: "Jan 9", time: "14:30 UTC", event: "Initial Jobless Claims", category: "economic", impact: "medium", countdown: 367200 },
  { id: "8", date: "Jan 10", time: "All Day", event: "New Hampshire Primary", category: "political", impact: "high", countdown: 453600 },
  { id: "9", date: "Jan 12", time: "00:00 UTC", event: "ETH Dencun Upgrade", category: "crypto", impact: "high", countdown: 626400 },
  { id: "10", date: "Jan 15", time: "10:00 UTC", event: "UK GDP Data", category: "economic", impact: "low", countdown: 885600 },
];

const impactConfig = {
  high: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/20", label: "HIGH", border: "border-primary/50" },
  medium: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "MED", border: "border-yellow-500/50" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary", label: "LOW", border: "border-muted-foreground/30" },
};

const categoryColors = {
  economic: "border-blue-500/50 text-blue-400",
  political: "border-purple-500/50 text-purple-400",
  crypto: "border-accent/50 text-accent",
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

const CalendarPage = () => {
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"all" | "high">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  
  useKeyboardShortcuts({
    onSearchOpen: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

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

  const filteredEvents = filter === "high" ? events.filter(e => e.impact === "high") : events;

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <TopNavBar />
      
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
                Economic Calendar
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                // MARKET CATALYSTS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-5 px-2 font-mono text-[9px]"
                onClick={() => setFilter("all")}
              >
                ALL
              </Button>
              <Button
                variant={filter === "high" ? "secondary" : "ghost"}
                size="sm"
                className="h-5 px-2 font-mono text-[9px]"
                onClick={() => setFilter("high")}
              >
                HIGH IMPACT
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto px-3 py-2">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date} className="mb-3">
                {/* Date Header */}
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dateEvents.map((event) => {
                    const config = impactConfig[event.impact];
                    const Icon = config.icon;
                    const countdown = countdowns[event.id] ?? event.countdown;

                    const eventIndex = dateEvents.indexOf(event);
                      return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-3 rounded-sm px-2 py-1.5 transition-all hover:bg-secondary/50 ${
                          eventIndex % 2 === 1 ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        {/* Time */}
                        <div className="flex w-16 shrink-0 items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {event.time}
                          </span>
                        </div>

                        {/* Impact Icon */}
                        <div className={`shrink-0 rounded-sm p-0.5 ${config.bg}`}>
                          <Icon className={`h-3 w-3 ${config.color}`} />
                        </div>

                        {/* Event Name */}
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[11px] text-foreground truncate block">
                            {event.event}
                          </span>
                        </div>

                        {/* Category Badge */}
                        <Badge
                          variant="outline"
                          className={`shrink-0 font-mono text-[7px] px-1 py-0 uppercase ${categoryColors[event.category]}`}
                        >
                          {event.category}
                        </Badge>

                        {/* Impact Badge */}
                        <Badge
                          variant="outline"
                          className={`shrink-0 font-mono text-[7px] px-1 py-0 ${config.border} ${config.color}`}
                        >
                          {config.label}
                        </Badge>

                        {/* Countdown */}
                        <div className="w-16 shrink-0 text-right">
                          <span
                            className={`font-mono text-[10px] font-bold ${
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Search, 
  TrendingUp, 
  Users, 
  Calendar, 
  Flame,
  ArrowRight,
  Command
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchItem {
  id: string;
  title: string;
  type: "market" | "whale" | "event";
  category?: string;
  subtitle?: string;
  path: string;
}

const searchableItems: SearchItem[] = [
  // Markets
  { id: "btc-100k-dec", title: "BTC > $100k by Dec 2024", type: "market", category: "crypto", subtitle: "+14.8% skew", path: "/event/btc-100k-dec" },
  { id: "trump-2024", title: "Trump Wins 2024 Election", type: "market", category: "politics", subtitle: "+11.5% skew", path: "/event/trump-2024" },
  { id: "biden-drop", title: "Biden Drops Out Before Convention", type: "market", category: "politics", subtitle: "+33.3% skew", path: "/event/biden-drop" },
  { id: "eth-5k-q1", title: "ETH > $5k Q1 2025", type: "market", category: "crypto", subtitle: "+12.0% skew", path: "/event/eth-5k-q1" },
  { id: "fed-rate-jan", title: "Fed Rate Cut in January", type: "market", category: "economics", subtitle: "+9.4% skew", path: "/event/fed-rate-jan" },
  { id: "superbowl-kc", title: "Chiefs Win Super Bowl", type: "market", category: "sports", subtitle: "+50.0% skew", path: "/event/superbowl-kc" },
  { id: "sol-200", title: "SOL > $200 by March", type: "market", category: "crypto", subtitle: "+8.2% skew", path: "/event/sol-200" },
  
  // Whales
  { id: "whale-1", title: "0xAB...4f92", type: "whale", subtitle: "+$142k PnL • 78.5% WR", path: "/app/whales" },
  { id: "whale-2", title: "0x7C...e821", type: "whale", subtitle: "+$98.5k PnL • 72.1% WR", path: "/app/whales" },
  { id: "whale-3", title: "0x2F...c4d8", type: "whale", subtitle: "+$78.9k PnL • 68.9% WR", path: "/app/whales" },
  { id: "whale-4", title: "0x9E...3f1c", type: "whale", subtitle: "+$61.4k PnL • 65.2% WR", path: "/app/whales" },
  
  // Events
  { id: "event-cpi", title: "CPI Inflation Data Release", type: "event", category: "economic", subtitle: "Today 14:00 UTC", path: "/app/calendar" },
  { id: "event-fed", title: "Fed Interest Rate Decision", type: "event", category: "economic", subtitle: "Today 18:30 UTC", path: "/app/calendar" },
  { id: "event-nfp", title: "NFP Employment Report", type: "event", category: "economic", subtitle: "Tomorrow 10:00 UTC", path: "/app/calendar" },
  { id: "event-etf", title: "Bitcoin ETF Decision Update", type: "event", category: "crypto", subtitle: "Jan 8 15:00 UTC", path: "/app/calendar" },
  { id: "event-nh", title: "New Hampshire Primary", type: "event", category: "political", subtitle: "Jan 10", path: "/app/calendar" },
];

const typeConfig = {
  market: { icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
  whale: { icon: Users, color: "text-primary", bg: "bg-primary/10" },
  event: { icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" },
};

// Simple fuzzy match - checks if all characters appear in order
const fuzzyMatch = (text: string, query: string): { match: boolean; score: number } => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (queryLower.length === 0) return { match: true, score: 0 };
  
  // Exact substring match gets highest score
  if (textLower.includes(queryLower)) {
    return { match: true, score: 100 - textLower.indexOf(queryLower) };
  }
  
  // Fuzzy character matching
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      score += consecutiveMatches * 2; // Bonus for consecutive matches
    } else {
      consecutiveMatches = 0;
    }
  }
  
  return { 
    match: queryIndex === queryLower.length, 
    score 
  };
};

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and sort results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show hot markets when no query
      return searchableItems
        .filter(item => item.type === "market")
        .slice(0, 6);
    }

    return searchableItems
      .map(item => {
        const titleMatch = fuzzyMatch(item.title, query);
        const categoryMatch = item.category ? fuzzyMatch(item.category, query) : { match: false, score: 0 };
        const subtitleMatch = item.subtitle ? fuzzyMatch(item.subtitle, query) : { match: false, score: 0 };
        
        return {
          ...item,
          score: Math.max(titleMatch.score, categoryMatch.score * 0.5, subtitleMatch.score * 0.3),
          match: titleMatch.match || categoryMatch.match || subtitleMatch.match,
        };
      })
      .filter(item => item.match)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Clear query when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = useCallback((item: SearchItem) => {
    onOpenChange(false);
    navigate(item.path);
  }, [navigate, onOpenChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  }, [results, selectedIndex, handleSelect]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 border-border bg-card">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search markets, whales, events..."
            className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() && (
            <div className="mb-2 flex items-center gap-2 px-2">
              <Flame className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                Hot Markets
              </span>
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <span className="font-mono text-sm">No results found</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((item, index) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors ${
                      isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${config.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-foreground truncate">
                          {item.title}
                        </span>
                        {item.category && (
                          <Badge 
                            variant="outline" 
                            className="shrink-0 border-border px-1 py-0 font-mono text-[8px] uppercase text-muted-foreground"
                          >
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      {item.subtitle && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[9px] text-muted-foreground">↑</kbd>
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[9px] text-muted-foreground">↓</kbd>
              <span className="font-mono text-[9px] text-muted-foreground">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">↵</kbd>
              <span className="font-mono text-[9px] text-muted-foreground">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[9px] text-muted-foreground">K to open</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

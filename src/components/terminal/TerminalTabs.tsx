import { TrendingUp, Zap, Anchor, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TabId = "markets" | "arbitrage" | "whales" | "analytics";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof TrendingUp;
  badge?: number;
  soon?: boolean;
}

interface TerminalTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  arbitrageCount?: number;
}

export const TerminalTabs = ({ activeTab, onTabChange, arbitrageCount = 0 }: TerminalTabsProps) => {
  const tabs: Tab[] = [
    { id: "markets", label: "Markets", icon: TrendingUp },
    { id: "arbitrage", label: "Arbitrage", icon: Zap, badge: arbitrageCount },
    { id: "whales", label: "Whales", icon: Anchor, soon: true },
    { id: "analytics", label: "Analytics", icon: BarChart3, soon: true },
  ];

  return (
    <div className="flex border-b border-border bg-secondary/30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isDisabled = tab.soon;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={`relative flex items-center gap-2 px-4 py-2 transition-all font-mono text-xs uppercase tracking-wider ${
              isActive
                ? "bg-background text-primary border-b-2 border-primary"
                : isDisabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
            
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge 
                className="ml-1 h-4 min-w-[1rem] px-1 bg-accent text-accent-foreground font-mono text-[9px] font-bold"
              >
                {tab.badge}
              </Badge>
            )}
            
            {tab.soon && (
              <Badge 
                variant="outline" 
                className="ml-1 border-muted-foreground/30 text-muted-foreground/60 font-mono text-[7px] px-1 py-0"
              >
                SOON
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};

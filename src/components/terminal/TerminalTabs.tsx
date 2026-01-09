import { BarChart3, Zap, Anchor, TrendingUp, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TabId = "markets" | "arbitrage" | "whales" | "analytics";

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
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
    { id: "markets", label: "Markets", icon: BarChart3 },
    { id: "arbitrage", label: "Arbitrage", icon: Zap, badge: arbitrageCount },
    { id: "whales", label: "Whales", icon: Anchor, soon: true },
    { id: "analytics", label: "Analytics", icon: TrendingUp, soon: true },
  ];

  return (
    <div className="flex items-center border-b border-border bg-secondary/20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isDisabled = tab.soon;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={`
              relative flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all
              ${isActive 
                ? "text-foreground border-b-2 border-primary bg-background" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }
              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
            <span>{tab.label}</span>
            
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge 
                variant="outline" 
                className={`
                  ml-1 px-1.5 py-0 font-mono text-[8px] 
                  ${isActive 
                    ? "border-accent/50 bg-accent/10 text-accent" 
                    : "border-muted-foreground/30 text-muted-foreground"
                  }
                `}
              >
                {tab.badge}
              </Badge>
            )}
            
            {tab.soon && (
              <Badge 
                variant="outline" 
                className="ml-1 px-1 py-0 font-mono text-[7px] border-muted-foreground/30 text-muted-foreground"
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

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketsTable } from "@/components/markets/MarketsTable";
import { ArbitrageOpportunities } from "@/components/arbitrage/ArbitrageOpportunities";
import { TrendingMarkets } from "@/components/markets/TrendingMarkets";
import { useTerminalStats } from "@/hooks/useTerminalStats";
import { TrendingUp, BarChart3, Zap, Activity } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  highlight?: boolean;
  icon: React.ReactNode;
}

const StatCard = ({ label, value, change, positive, highlight, icon }: StatCardProps) => (
  <div className={`
    flex items-center gap-3 px-4 py-3 rounded border
    ${highlight 
      ? 'bg-accent/10 border-accent/30' 
      : 'bg-card border-border'
    }
  `}>
    <div className={`${highlight ? 'text-accent' : 'text-muted-foreground'}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-mono font-bold ${highlight ? 'text-accent' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
    {change && (
      <div className={`text-xs font-mono ml-auto ${positive ? 'text-accent' : 'text-destructive'}`}>
        {positive ? '+' : ''}{change}
      </div>
    )}
  </div>
);

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useTerminalStats();
  const [activeTab, setActiveTab] = useState("markets");

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Stats Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard 
              icon={<BarChart3 className="w-5 h-5" />}
              label="24h Volume" 
              value={statsLoading ? "..." : formatVolume(stats?.totalVolume24h || 0)}
              change="+12.4%"
              positive
            />
            <StatCard 
              icon={<Activity className="w-5 h-5" />}
              label="Active Markets" 
              value={statsLoading ? "..." : stats?.totalMarkets.toLocaleString() || "0"}
            />
            <StatCard 
              icon={<Zap className="w-5 h-5" />}
              label="Arbitrage Opportunities" 
              value={statsLoading ? "..." : String(stats?.arbitrageCount || 0)}
              highlight
            />
            <StatCard 
              icon={<TrendingUp className="w-5 h-5" />}
              label="Platforms" 
              value={statsLoading ? "..." : String(stats?.platformCount || 0)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger 
              value="markets" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Markets
            </TabsTrigger>
            <TabsTrigger 
              value="arbitrage"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Zap className="w-4 h-4" />
              Arbitrage
              {stats?.arbitrageCount ? (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-accent text-accent-foreground rounded font-bold">
                  {stats.arbitrageCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger 
              value="trending"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="mt-0">
            <MarketsTable />
          </TabsContent>

          <TabsContent value="arbitrage" className="mt-0">
            <ArbitrageOpportunities />
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <TrendingMarkets />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

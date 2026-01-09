import { useRef, useState } from "react";
import { CommandBar, CommandBarRef } from "@/components/terminal/CommandBar";
import { HotTicker } from "@/components/terminal/HotTicker";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { GlobalStatsBar } from "@/components/terminal/GlobalStatsBar";
import { WhaleRadar } from "@/components/terminal/WhaleRadar";
import { ImpactCalendar } from "@/components/terminal/ImpactCalendar";
import { FooterBar } from "@/components/terminal/FooterBar";
import { SearchModal } from "@/components/terminal/SearchModal";
import { TerminalTabs, TabId } from "@/components/terminal/TerminalTabs";
import { MarketsList } from "@/components/terminal/MarketsList";
import { ArbitrageScanner } from "@/components/terminal/ArbitrageScanner";
import { ComingSoon } from "@/components/terminal/ComingSoon";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTerminalStats } from "@/hooks/useGroupedMarkets";

const TerminalApp = () => {
  const commandBarRef = useRef<CommandBarRef>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("markets");

  const { data: stats } = useTerminalStats();

  useKeyboardShortcuts({
    onSearchOpen: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "markets":
        return <MarketsList />;
      case "arbitrage":
        return <ArbitrageScanner />;
      case "whales":
        return <ComingSoon feature="Whale Tracking" description="Track high-value wallets and their prediction market activity. See real-time trades, PnL, and copy-trade opportunities." />;
      case "analytics":
        return <ComingSoon feature="Advanced Analytics" description="AI-powered market analysis, sentiment tracking, and price predictions. Powered by Claude AI." />;
      default:
        return <MarketsList />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Command Bar (Top Nav) */}
      <CommandBar ref={commandBarRef} />

      {/* Hot Events Ticker */}
      <HotTicker />

      {/* Global Stats Bar */}
      <GlobalStatsBar />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <IconSidebar />

        {/* Main Content Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Main Content with Tabs (65%) */}
          <div className="flex w-[65%] min-w-0 flex-col border-r border-border">
            {/* Tab Navigation */}
            <TerminalTabs 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              arbitrageCount={stats?.arbitrageCount || 0}
            />
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {renderTabContent()}
            </div>
          </div>

          {/* Column 2: Market Intel (35%) */}
          <div className="flex w-[35%] min-w-0 flex-col">
            {/* Whale Radar (50% of column height) */}
            <div className="h-[50%] min-h-0 border-b border-border">
              <WhaleRadar />
            </div>
            {/* Impact Calendar (50% of column height) */}
            <div className="h-[50%] min-h-0">
              <ImpactCalendar />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <FooterBar />
    </div>
  );
};

export default TerminalApp;

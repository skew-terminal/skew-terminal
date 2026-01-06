import { useRef, useState } from "react";
import { CommandBar, CommandBarRef } from "@/components/terminal/CommandBar";
import { HotTicker } from "@/components/terminal/HotTicker";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { GlobalStatsBar } from "@/components/terminal/GlobalStatsBar";
import { SpreadScanner } from "@/components/terminal/SpreadScanner";
import { WhaleRadar } from "@/components/terminal/WhaleRadar";
import { ImpactCalendar } from "@/components/terminal/ImpactCalendar";
import { FooterBar } from "@/components/terminal/FooterBar";
import { SearchModal } from "@/components/terminal/SearchModal";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const TerminalApp = () => {
  const commandBarRef = useRef<CommandBarRef>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useKeyboardShortcuts({
    onSearchOpen: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Command Bar (New TopNav) */}
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
          {/* Column 1: Spread Scanner (65%) */}
          <div className="flex w-[65%] min-w-0 flex-col border-r border-border">
            <SpreadScanner />
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

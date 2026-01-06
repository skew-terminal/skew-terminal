import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { GlobalStatsBar } from "@/components/terminal/GlobalStatsBar";
import { SpreadScanner } from "@/components/terminal/SpreadScanner";
import { WhaleRadar } from "@/components/terminal/WhaleRadar";
import { ImpactCalendar } from "@/components/terminal/ImpactCalendar";

const TerminalApp = () => {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Navigation */}
      <TopNavBar />

      {/* Global Stats Bar */}
      <GlobalStatsBar />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <IconSidebar />

        {/* Main Content Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Spread Scanner (65%) */}
          <div className="flex w-[65%] min-w-0 flex-col border-r border-border/50">
            <SpreadScanner />
          </div>

          {/* Column 2: Market Intel (35%) */}
          <div className="flex w-[35%] min-w-0 flex-col">
            {/* Whale Radar (50% of column height) */}
            <div className="h-[50%] min-h-0 border-b border-border/50">
              <WhaleRadar />
            </div>
            {/* Impact Calendar (50% of column height) */}
            <div className="h-[50%] min-h-0">
              <ImpactCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalApp;

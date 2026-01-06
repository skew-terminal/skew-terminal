import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { MainChart } from "@/components/terminal/MainChart";
import { SmartMoneyIndicator } from "@/components/terminal/SmartMoneyIndicator";
import { LiveTape } from "@/components/terminal/LiveTape";
import { ArbMatrix } from "@/components/terminal/ArbMatrix";
import { WhaleTracker } from "@/components/terminal/WhaleTracker";
import { EventCalendar } from "@/components/terminal/EventCalendar";

const TerminalApp = () => {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Navigation */}
      <TopNavBar />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <IconSidebar />

        {/* Main Content Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Chart Engine (60%) */}
          <div className="flex w-[60%] min-w-0 flex-col border-r border-border">
            {/* Main Chart (70% of column height) */}
            <div className="h-[65%] min-h-0">
              <MainChart />
            </div>
            {/* Smart Money Indicator (30% of column height) */}
            <div className="h-[35%] min-h-0">
              <SmartMoneyIndicator />
            </div>
          </div>

          {/* Column 2: Data Feed (20%) */}
          <div className="flex w-[20%] min-w-0 flex-col border-r border-border">
            {/* Live Tape (60% of column height) */}
            <div className="h-[55%] min-h-0 border-b border-border">
              <LiveTape />
            </div>
            {/* Arb Matrix (40% of column height) */}
            <div className="h-[45%] min-h-0">
              <ArbMatrix />
            </div>
          </div>

          {/* Column 3: Context & Tools (20%) */}
          <div className="flex w-[20%] min-w-0 flex-col">
            {/* Whale Tracker (50% of column height) */}
            <div className="h-[50%] min-h-0 border-b border-border">
              <WhaleTracker />
            </div>
            {/* Event Calendar (50% of column height) */}
            <div className="h-[50%] min-h-0">
              <EventCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalApp;

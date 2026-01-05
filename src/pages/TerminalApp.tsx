import { TerminalSidebar } from "@/components/TerminalSidebar";
import { TerminalHeader } from "@/components/TerminalHeader";
import { ArbitrageTable } from "@/components/ArbitrageTable";
import { TrendingUp, Activity, AlertCircle } from "lucide-react";

const TerminalApp = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <TerminalSidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <TerminalHeader />

        {/* Content area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Stats row */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard
              icon={TrendingUp}
              label="Active Spreads"
              value="10"
              accent="orange"
            />
            <StatCard
              icon={Activity}
              label="Avg. Spread"
              value="+11.4%"
              accent="green"
            />
            <StatCard
              icon={AlertCircle}
              label="High Value Opps"
              value="4"
              accent="orange"
            />
          </div>

          {/* Main table */}
          <ArbitrageTable />

          {/* Bottom info */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground">
                Live data feed active
              </span>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: "orange" | "green";
}

const StatCard = ({ icon: Icon, label, value, accent }: StatCardProps) => {
  return (
    <div className="border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30">
      <div className="flex items-center gap-3">
        <div 
          className={`flex h-10 w-10 items-center justify-center ${
            accent === "orange" ? "bg-primary/20" : "bg-accent/20"
          }`}
        >
          <Icon 
            className={`h-5 w-5 ${
              accent === "orange" ? "text-primary" : "text-accent"
            }`} 
          />
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div 
            className={`font-mono text-2xl font-bold ${
              accent === "orange" ? "text-primary" : "text-accent"
            }`}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalApp;

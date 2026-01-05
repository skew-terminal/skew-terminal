import { Button } from "@/components/ui/button";
import { Wallet, ChevronRight } from "lucide-react";

export const TerminalHeader = () => {
  return (
    <header className="terminal-header flex h-14 items-center justify-between px-4 lg:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-sm">
        <span className="text-muted-foreground">Terminal</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-primary">Scanner</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Prices */}
        <div className="hidden items-center gap-4 font-mono text-sm md:flex">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">SOL:</span>
            <span className="text-accent">$142.50</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ETH:</span>
            <span className="text-accent">$3,100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">BTC:</span>
            <span className="text-accent">$97,240</span>
          </div>
        </div>

        {/* Connect Wallet */}
        <Button variant="skewOutline" size="sm" className="gap-2">
          <span className="[transform:skewX(5deg)]">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="hidden [transform:skewX(5deg)] sm:inline">Connect Wallet</span>
        </Button>
      </div>
    </header>
  );
};

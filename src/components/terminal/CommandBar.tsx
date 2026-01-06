import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Settings, Wallet, Search, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CommandBarRef {
  focusSearch: () => void;
}
const networks = [
  { id: "polygon", name: "Polygon", color: "bg-purple-500" },
  { id: "solana", name: "Solana", color: "bg-gradient-to-r from-purple-500 to-cyan-400" },
  { id: "bnb", name: "BNB Chain", color: "bg-yellow-500" },
];

const priceData = [
  { symbol: "SOL", price: "142.15", change: "+2.4%" },
  { symbol: "ETH", price: "3,210", change: "+1.2%" },
  { symbol: "BTC", price: "97,450", change: "+0.8%" },
];

export const CommandBar = forwardRef<CommandBarRef>((_, ref) => {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [isLive] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
    },
  }));

  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-card px-2">
      {/* Left: Logo + Network Switcher */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center bg-primary [-webkit-transform:skewX(-10deg)] [transform:skewX(-10deg)]">
            <span className="text-sm font-black text-primary-foreground [transform:skewX(10deg)]">S</span>
          </div>
          <span className="font-sans text-sm font-black tracking-wider text-foreground hidden sm:block">
            SKEW
          </span>
        </Link>

        {/* Network Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              <div className={`h-2 w-2 rounded-full ${selectedNetwork.color}`} />
              <span>{selectedNetwork.name}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {networks.map((network) => (
              <DropdownMenuItem
                key={network.id}
                onClick={() => setSelectedNetwork(network)}
                className="gap-2 font-mono text-xs"
              >
                <div className={`h-2 w-2 rounded-full ${network.color}`} />
                {network.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div className={`h-2 w-2 rounded-full ${isLive ? "bg-accent" : "bg-yellow-500"}`} />
            {isLive && (
              <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-accent opacity-75" />
            )}
          </div>
          <span className="font-mono text-[9px] text-muted-foreground">
            {isLive ? "LIVE" : "DELAYED"}
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative group">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search markets... (⌘K)"
            className="w-full h-7 rounded-sm border border-border bg-secondary/50 pl-7 pr-3 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-secondary transition-all"
          />
        </div>
      </div>

      {/* Right: Prices + Actions */}
      <div className="flex items-center gap-4">
        {/* Price Tickers */}
        <div className="hidden lg:flex items-center gap-4">
          {priceData.map((item) => (
            <div key={item.symbol} className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-muted-foreground">{item.symbol}</span>
              <span className="text-foreground">${item.price}</span>
              <span className={item.change.startsWith("+") ? "text-accent" : "text-destructive"}>
                {item.change}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-primary/50 font-mono text-[10px] text-primary hover:bg-primary/10 px-2"
          >
            <Wallet className="h-3 w-3" />
            <span className="hidden sm:inline">Connect</span>
          </Button>
        </div>
      </div>
    </header>
  );
});

CommandBar.displayName = "CommandBar";

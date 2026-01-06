import { Settings, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const priceData = [
  { symbol: "SOL", price: "142.15", change: "+2.4%" },
  { symbol: "ETH", price: "3,210.50", change: "+1.2%" },
  { symbol: "BTC", price: "97,450", change: "+0.8%" },
  { symbol: "GAS", price: "25 Gwei", change: "" },
];

export const TopNavBar = () => {
  return (
    <header className="flex h-10 items-center justify-between border-b border-border/50 bg-card px-3">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center bg-primary [-webkit-transform:skewX(-10deg)] [transform:skewX(-10deg)]">
          <span className="text-sm font-black text-primary-foreground [transform:skewX(10deg)]">S</span>
        </div>
        <span className="font-sans text-sm font-black tracking-wider text-foreground">
          SKEW
        </span>
      </Link>

      {/* Center Tickers */}
      <div className="hidden items-center gap-6 md:flex">
        {priceData.map((item) => (
          <div key={item.symbol} className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">{item.symbol}:</span>
            <span className="text-foreground">${item.price}</span>
            {item.change && (
              <span className={item.change.startsWith("+") ? "text-accent" : "text-destructive"}>
                {item.change}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-primary/50 font-mono text-xs text-primary hover:bg-primary/10"
        >
          <Wallet className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>
      </div>
    </header>
  );
};

import { ArrowUpRight } from "lucide-react";

const arbData = [
  { event: "Trump Victory", spread: 8.4, direction: "up" },
  { event: "BTC > $100k Q1", spread: 12.1, direction: "up" },
  { event: "Biden Drops Out", spread: 5.2, direction: "up" },
  { event: "Fed Rate Cut Mar", spread: 4.8, direction: "down" },
  { event: "ETH > $5k 2024", spread: 6.7, direction: "up" },
];

export const ArbMatrix = () => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
          Arb Matrix
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          TOP 5
        </span>
      </div>

      {/* Data */}
      <div className="flex-1 overflow-auto">
        {arbData.map((arb, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-border px-3 py-2 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs text-foreground truncate max-w-[120px]">
                {arb.event}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`font-mono text-xs font-bold ${
                  arb.spread >= 5 ? "text-accent" : "text-foreground"
                }`}
              >
                +{arb.spread}%
              </span>
              {arb.spread >= 5 && (
                <ArrowUpRight className="h-3 w-3 text-accent" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <button className="w-full font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
          VIEW ALL OPPORTUNITIES →
        </button>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";

interface Trade {
  id: number;
  time: string;
  platform: string;
  event: string;
  side: "YES" | "NO";
  size: number;
}

const initialTrades: Trade[] = [
  { id: 1, time: "14:02:35", platform: "POLY", event: "BTC>100k", side: "YES", size: 15000 },
  { id: 2, time: "14:02:28", platform: "KALSHI", event: "Fed Cut", side: "NO", size: 8500 },
  { id: 3, time: "14:02:21", platform: "POLY", event: "Trump Win", side: "YES", size: 42000 },
  { id: 4, time: "14:02:15", platform: "POLY", event: "ETH>5k", side: "YES", size: 5200 },
  { id: 5, time: "14:02:08", platform: "KALSHI", event: "Biden Drop", side: "YES", size: 28000 },
  { id: 6, time: "14:01:58", platform: "POLY", event: "SOL>200", side: "NO", size: 12000 },
  { id: 7, time: "14:01:45", platform: "POLY", event: "BTC>100k", side: "YES", size: 95000 },
  { id: 8, time: "14:01:32", platform: "KALSHI", event: "Recession", side: "NO", size: 18500 },
];

export const LiveTape = () => {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isLive, setIsLive] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newTrade: Trade = {
        id: Date.now(),
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        platform: Math.random() > 0.5 ? "POLY" : "KALSHI",
        event: ["BTC>100k", "Trump Win", "Fed Cut", "ETH>5k"][Math.floor(Math.random() * 4)],
        side: Math.random() > 0.5 ? "YES" : "NO",
        size: Math.floor(Math.random() * 50000) + 5000,
      };

      setTrades((prev) => [newTrade, ...prev.slice(0, 7)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatSize = (size: number) => {
    if (size >= 1000) return `$${(size / 1000).toFixed(1)}k`;
    return `$${size}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
            Live Tape
          </span>
          {isLive && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          )}
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`font-mono text-[10px] ${isLive ? 'text-accent' : 'text-muted-foreground'}`}
        >
          {isLive ? "LIVE" : "PAUSED"}
        </button>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-auto">
        {trades.map((trade, index) => (
          <div
            key={trade.id}
            className={`flex items-center gap-2 border-b border-border px-3 py-1.5 font-mono text-[10px] transition-all ${
              index === 0 ? "bg-secondary/50" : ""
            }`}
          >
            <span className="text-muted-foreground">{trade.time}</span>
            <span className="rounded bg-secondary px-1 text-muted-foreground">
              {trade.platform}
            </span>
            <span className="flex-1 truncate text-foreground">{trade.event}</span>
            <span
              className={`font-bold ${
                trade.side === "YES" ? "text-accent" : "text-primary"
              }`}
            >
              {trade.side}
            </span>
            <span
              className={`text-right ${
                trade.size >= 25000 ? "text-accent font-bold" : "text-foreground"
              }`}
            >
              {formatSize(trade.size)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

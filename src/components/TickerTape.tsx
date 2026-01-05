import { useEffect, useState } from "react";

const tickerData = [
  { event: "TRUMP VICTORY", polyPrice: "60¢", kalshiPrice: "55¢", skew: "+8.3%", positive: true },
  { event: "FED RATE HIKE JAN", polyPrice: "20¢", kalshiPrice: "28¢", skew: "+28.6%", positive: true },
  { event: "BTC $100K Q1", polyPrice: "45¢", kalshiPrice: "42¢", skew: "+6.7%", positive: true },
  { event: "ETH FLIP BTC", polyPrice: "8¢", kalshiPrice: "12¢", skew: "+33.3%", positive: true },
  { event: "RECESSION 2025", polyPrice: "35¢", kalshiPrice: "38¢", skew: "+7.9%", positive: true },
  { event: "SOLANA $500", polyPrice: "15¢", kalshiPrice: "11¢", skew: "+26.7%", positive: true },
];

export const TickerTape = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const tickerContent = tickerData.map((item, i) => (
    <span key={i} className="inline-flex items-center gap-2 mr-12">
      <span className="font-mono text-foreground">{item.event}:</span>
      <span className="text-muted-foreground">Poly {item.polyPrice}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">Kalshi {item.kalshiPrice}</span>
      <span className="mx-1">|</span>
      <span className="font-bold text-accent">SKEW: {item.skew}</span>
      <span className="text-muted-foreground">///</span>
    </span>
  ));

  return (
    <div className="w-full overflow-hidden border-y border-border bg-card/50 py-3">
      <div 
        className="inline-flex whitespace-nowrap font-mono text-sm animate-ticker"
        style={{ width: "200%" }}
      >
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
};

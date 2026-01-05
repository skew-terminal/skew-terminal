import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ArbitrageOpportunity {
  id: number;
  event: string;
  marketA: { name: string; price: string };
  marketB: { name: string; price: string };
  skewPercent: number;
  liquidity: number;
}

const mockData: ArbitrageOpportunity[] = [
  { id: 1, event: "Will BTC hit $100k in Q1 2025?", marketA: { name: "Polymarket", price: "60¢" }, marketB: { name: "Kalshi", price: "52¢" }, skewPercent: 13.3, liquidity: 85 },
  { id: 2, event: "Trump wins 2024 election?", marketA: { name: "Polymarket", price: "62¢" }, marketB: { name: "Kalshi", price: "55¢" }, skewPercent: 11.3, liquidity: 92 },
  { id: 3, event: "Fed cuts rates in January?", marketA: { name: "Polymarket", price: "28¢" }, marketB: { name: "Kalshi", price: "35¢" }, skewPercent: 20.0, liquidity: 78 },
  { id: 4, event: "ETH reaches $5k before March?", marketA: { name: "Polymarket", price: "42¢" }, marketB: { name: "Kalshi", price: "38¢" }, skewPercent: 9.5, liquidity: 65 },
  { id: 5, event: "US recession in 2025?", marketA: { name: "Polymarket", price: "35¢" }, marketB: { name: "Kalshi", price: "41¢" }, skewPercent: 14.6, liquidity: 88 },
  { id: 6, event: "Solana flips Ethereum by TVL?", marketA: { name: "Polymarket", price: "18¢" }, marketB: { name: "Kalshi", price: "22¢" }, skewPercent: 18.2, liquidity: 45 },
  { id: 7, event: "Apple stock above $250 EOY?", marketA: { name: "Polymarket", price: "55¢" }, marketB: { name: "Kalshi", price: "52¢" }, skewPercent: 5.5, liquidity: 72 },
  { id: 8, event: "XRP wins SEC case fully?", marketA: { name: "Polymarket", price: "72¢" }, marketB: { name: "Kalshi", price: "65¢" }, skewPercent: 9.7, liquidity: 68 },
  { id: 9, event: "NVIDIA stock split in 2025?", marketA: { name: "Polymarket", price: "30¢" }, marketB: { name: "Kalshi", price: "28¢" }, skewPercent: 6.7, liquidity: 55 },
  { id: 10, event: "MicroStrategy buys more BTC Q1?", marketA: { name: "Polymarket", price: "88¢" }, marketB: { name: "Kalshi", price: "82¢" }, skewPercent: 6.8, liquidity: 90 },
];

export const ArbitrageTable = () => {
  return (
    <div className="overflow-hidden border border-border bg-card">
      {/* Table header */}
      <div className="border-b border-border bg-secondary/30 px-4 py-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
          Live Arbitrage Opportunities
        </h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {mockData.length} active spreads detected
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="bg-secondary/20">
              <th>Event</th>
              <th>Market A</th>
              <th>Market B</th>
              <th>Skew %</th>
              <th>Liquidity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className="group">
                <td className="max-w-[300px]">
                  <span className="text-foreground">{item.event}</span>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{item.marketA.name}</span>
                    <span className="font-bold text-foreground">{item.marketA.price}</span>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{item.marketB.name}</span>
                    <span className="font-bold text-foreground">{item.marketB.price}</span>
                  </div>
                </td>
                <td>
                  <span 
                    className={`inline-flex px-3 py-1 font-bold ${
                      item.skewPercent > 5 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    +{item.skewPercent.toFixed(1)}%
                  </span>
                </td>
                <td className="w-32">
                  <div className="flex items-center gap-2">
                    <Progress value={item.liquidity} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{item.liquidity}%</span>
                  </div>
                </td>
                <td>
                  <Button variant="trade" size="sm">
                    TRADE
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

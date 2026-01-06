import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

const tabs = ["Smart Money Delta", "Global Volume", "Sentiment Skew"];

// Mock smart money data
const smartMoneyData = [
  { time: "06:00", retail: 15000, whale: 28000, delta: 13000 },
  { time: "08:00", retail: 22000, whale: 18000, delta: -4000 },
  { time: "10:00", retail: 18000, whale: 35000, delta: 17000 },
  { time: "12:00", retail: 25000, whale: 42000, delta: 17000 },
  { time: "14:00", retail: 30000, whale: 25000, delta: -5000 },
  { time: "16:00", retail: 28000, whale: 48000, delta: 20000 },
  { time: "18:00", retail: 35000, whale: 30000, delta: -5000 },
  { time: "20:00", retail: 20000, whale: 55000, delta: 35000 },
];

export const SmartMoneyIndicator = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wide transition-all ${
              activeTab === index
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {activeTab === 0 && (
          <div className="h-full">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                WHALE vs RETAIL FLOW
              </span>
              <div className="flex items-center gap-4 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-accent" />
                  Smart Money
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-primary" />
                  Retail
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={smartMoneyData} barGap={0}>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => `${v / 1000}k`}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 4%)',
                    border: '1px solid hsl(0, 0%, 15%)',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '10px',
                  }}
                  formatter={(value: number) => [`$${(value / 1000).toFixed(1)}k`, '']}
                />
                <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
                  {smartMoneyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.delta >= 0 ? 'hsl(110, 100%, 55%)' : 'hsl(16, 100%, 50%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {activeTab === 1 && (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Global Volume Chart - Coming Soon
          </div>
        )}
        
        {activeTab === 2 && (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Sentiment Skew Analysis - Coming Soon
          </div>
        )}
      </div>
    </div>
  );
};

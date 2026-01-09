# Supported Prediction Market Platforms

## Overview
SKEW aggregates data from 19+ prediction market platforms across multiple blockchains to identify arbitrage opportunities.

---

## Tier 1: Major Platforms (Implemented)

### Kalshi ✅
- **Type**: Centralized, US Regulated (CFTC)
- **Focus**: Politics, Economics, Weather, Events
- **API**: REST API (public)
- **Status**: Active

### Polymarket ✅
- **Type**: Decentralized
- **Chain**: Polygon
- **Focus**: Largest crypto prediction market, all topics
- **API**: Gamma API + CLOB
- **Status**: Active

### Azuro ✅
- **Type**: Decentralized Protocol
- **Chain**: Polygon, Gnosis, Arbitrum
- **Focus**: Sports betting
- **API**: TheGraph Subgraph
- **Status**: Active

### PancakeSwap Prediction ✅
- **Type**: Decentralized
- **Chain**: BSC
- **Focus**: BNB/CAKE price predictions
- **API**: Direct RPC calls
- **Status**: Active

---

## Tier 2: Politics & General (Pending)

### PredictIt 🔄
- **Type**: Centralized, US Regulated
- **Focus**: US Politics exclusively
- **API**: https://www.predictit.org/api/marketdata/all/
- **Notes**: Good for political arbitrage with Kalshi/Polymarket
- **Status**: Pending implementation

### Manifold Markets 🔄
- **Type**: Centralized (Play money + Mana)
- **Focus**: All topics, large community, user-created markets
- **API**: https://api.manifold.markets/v0/markets
- **Notes**: Good sentiment indicator, high volume
- **Status**: Pending implementation

### Metaculus 🔄
- **Type**: Centralized (Forecasting)
- **Focus**: Science, Technology, Long-term forecasting
- **API**: https://www.metaculus.com/api2/
- **Notes**: Academic/research focused
- **Status**: Pending implementation

### Futuur 🔄
- **Type**: Centralized
- **Focus**: General prediction markets
- **API**: TBD
- **Status**: Pending implementation

---

## Tier 3: Solana Ecosystem (Pending)

### DivvyBet 🔄
- **Type**: Decentralized
- **Chain**: Solana
- **Focus**: Sports betting
- **Contract**: TBD
- **Status**: Pending implementation

### BetDEX 🔄
- **Type**: Decentralized
- **Chain**: Solana
- **Focus**: Sports betting with orderbook
- **Notes**: Uses Monaco Protocol
- **Status**: Pending implementation

### Monaco Protocol 🔄
- **Type**: Protocol/Infrastructure
- **Chain**: Solana
- **Focus**: Sports betting infrastructure
- **API**: https://github.com/MonacoProtocol
- **Notes**: Powers multiple frontends
- **Status**: Pending implementation

---

## Tier 4: EVM Chains (Pending)

### Opinions 🔄
- **Type**: Decentralized
- **Chain**: BSC
- **Focus**: Event predictions
- **Status**: Pending implementation

### Probable 🔄
- **Type**: Decentralized
- **Chain**: BSC
- **Focus**: Event predictions
- **Status**: Pending implementation

### Thales (Overtime Markets) 🔄
- **Type**: Decentralized AMM
- **Chain**: Arbitrum, Optimism, Base
- **Focus**: Sports betting
- **API**: https://github.com/thales-markets
- **Notes**: High potential for sports arb with Azuro
- **Status**: Pending implementation

### Limitless 🔄
- **Type**: Decentralized
- **Chain**: Base
- **Focus**: Prediction markets
- **Status**: Pending implementation

### Myriad 🔄
- **Type**: Decentralized
- **Chain**: Base
- **Focus**: Prediction markets
- **Status**: Pending implementation

---

## Tier 5: Other Chains (Pending)

### Omen 🔄
- **Type**: Decentralized
- **Chain**: Gnosis Chain (xDAI)
- **Focus**: General prediction markets
- **API**: TheGraph subgraph
- **Notes**: One of oldest DeFi prediction markets
- **Status**: Pending implementation

### Augur (Turbo) 🔄
- **Type**: Decentralized
- **Chain**: Polygon
- **Focus**: Sports, Crypto, General
- **API**: TheGraph subgraph
- **Notes**: Pioneer prediction market
- **Status**: Pending implementation

### Zeitgeist 🔄
- **Type**: Decentralized
- **Chain**: Polkadot parachain
- **Focus**: General prediction markets
- **API**: https://docs.zeitgeist.pm/
- **Status**: Pending implementation

---

## Implementation Priority

### Phase 1: High-Value Arbitrage Sources
1. **PredictIt** - Direct arb with Kalshi on politics
2. **Thales/Overtime** - Direct arb with Azuro on sports
3. **Manifold** - High volume sentiment data

### Phase 2: Expand Sports Coverage
4. **Monaco Protocol** - Solana sports data
5. **BetDEX** - More Solana sports
6. **DivvyBet** - Solana sports

### Phase 3: Additional Sources
7. **Omen** - Gnosis markets
8. **Augur** - Polygon markets
9. **Limitless/Myriad** - Base markets
10. **Zeitgeist** - Polkadot markets

---

## Data Normalization

All platforms are normalized to internal categories:
- `politics` - Elections, government, policy
- `crypto` - Prices, events, protocol outcomes
- `sports` - All sports events
- `economics` - Economic indicators, Fed, markets
- `entertainment` - Media, celebrities, culture
- `other` - Everything else

---

## Matching Strategy

Markets are matched across platforms using:
1. **Jaccard similarity** on tokenized titles
2. **Key entity extraction** (team names, candidate names, dates)
3. **Category matching**
4. **Resolution date proximity**

Minimum threshold: 65% similarity score

# AUTOMEEP — Self-Paying Liquidation Shield for Solana DeFi

> **A decentralized router that transforms idle Kamino yield into Derive put options, creating a zero-cost liquidation shield for your Solana loans.**

---

## Overview

**Automeep** is a DeFi protocol interface built on Solana that protects borrowers from liquidation events — without requiring any upfront cost. It works by automatically routing yield earned from **Kamino Finance** into deeply out-of-the-money **put options** purchased on **Derive**, forming a self-sustaining hedge that covers your loan collateral in the event of a market crash.

### The Core Idea

```
SOL Collateral → Kamino Yield (~6%+ APY) → Derive OTM Put Options → Liquidation Shield
```

Your SOL is supplied to Kamino, earning yield. That yield is continuously harvested and used to purchase put options on Derive. If the market crashes past your liquidation threshold, the options exercise atomically — filling your collateral gap and preventing liquidation.

**Zero cost. Zero manual intervention. Zero liquidation risk.**

---

## Key Features

| Feature | Description |
|---|---|
| 🛡️ **Self-Paying Hedge** | Kamino yield fully subsidizes Derive option premiums |
| ⚡ **Atomic Execution** | Flash-crash triggers auto-exercise options instantly |
| 📡 **Live Market Data** | Real-time SOL/BTC/ETH prices via Deribit WebSocket API |
| 📈 **Live Kamino APY** | Real-time Kamino lending rates fetched from Kamino Finance API |
| 🔁 **Auto-Rebalancing** | Smart Router continuously adjusts to market conditions |
| 🧮 **Interactive Simulator** | Full dApp simulation — model your loan hedge before going live |
| 🎨 **Cinematic UI** | Full-screen video hero, animated ticker board, staggered card animations |

---

## Architecture

The protocol is built on three interlinked modules:

### 01 · Kamino Yield — Capital Supply Route
- Auto-supplies SOL to Kamino's liquidity vaults
- Earns 6%+ base APY on deposited collateral
- Uses SOL as collateral to borrow USDC
- Continuously harvests yield and routes it to the options vault

### 02 · Derive Options — Hedge Derivatives Engine
- Uses harvested yield to purchase deep OTM put options on Derive
- Options are matched to loan maturation durations
- Fully collateralized underwriters — zero counterparty insolvency risk
- Exercises atomically when price breaches liquidation thresholds

### 03 · Smart Router — Cross-Protocol Arbitrage
- Monitors loan health factors in real time via Solana state channels
- Triggers flash-crash execution if liquidation is imminent
- Optimizes option premium cost for maximum yield efficiency
- Requires zero manual input — runs fully in the background

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **Live Price Feed** | Deribit WebSocket API (`wss://www.deribit.com/ws/api/v2`) |
| **Lending Rates** | Kamino Finance REST API |
| **Backend** | Express.js (Node.js) |
| **AI Integration** | Google Gemini AI (`@google/genai`) |

---

## Project Structure

```
src/
├── App.tsx                          # Root app — layout, modal orchestration, data wiring
├── main.tsx                         # React entry point
├── index.css                        # Global styles & design tokens
├── types.ts                         # Shared TypeScript types
│
├── components/
│   ├── Hero.tsx                     # Full-screen cinematic hero section
│   ├── Concept.tsx                  # Protocol concept overview section
│   ├── Architecture.tsx             # 4-card architecture explainer section
│   ├── Navbar.tsx                   # Navigation bar (inside Hero)
│   ├── RealtimeTickerBoard.tsx      # Live SOL/BTC/ETH price ticker strip
│   ├── InteractiveWidget.tsx        # Full dApp simulation modal
│   ├── WalletButton.tsx             # Wallet connection button
│   ├── AnimatedCharacterParagraph.tsx  # Character-by-character text animation
│   ├── WordsPullUp.tsx              # Word-by-word pull-up animation
│   └── WordsPullUpMultiStyle.tsx    # Multi-style segmented word animation
│
└── hooks/
    ├── useDeribitWS.ts              # Deribit WebSocket — live SOL/BTC/ETH prices + options chain
    └── useKaminoRates.ts            # Kamino Finance API — live lending/borrowing APY rates
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>

# 2. Navigate into the project
cd automeep

# 3. Install dependencies
npm install
```

### Environment Setup

Copy the example environment file and configure your keys:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required for Gemini AI API calls
GEMINI_API_KEY="your_gemini_api_key_here"

# The URL where this app is hosted (for self-referential links)
APP_URL="http://localhost:3000"
```

> **Note:** The Deribit WebSocket and Kamino Finance API are public endpoints — no API keys are required for market data.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

### Other Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove build artifacts |

---

## Live Data Sources

### Deribit WebSocket (`useDeribitWS`)
Connects to the Deribit public WebSocket API to stream:
- **SOL/USD index price** — real-time
- **BTC/USD index price** — real-time
- **ETH/USD index price** — real-time
- **SOL options chain** — book summary polled every 30 seconds
- Auto-reconnects on disconnect with a 5-second retry interval

### Kamino Finance API (`useKaminoRates`)
Fetches from the Kamino mainnet-beta market endpoint:
- **SOL** — lend APY, borrow APY, max LTV
- **USDC** — lend APY, borrow APY, max LTV
- Refreshes every 60 seconds

---

## How the Simulation Works

The **Interactive Widget** lets you simulate a hedged loan position before deploying capital:

1. **Set your SOL collateral amount** and desired USDC loan
2. **View live Kamino APY** and calculated yield earnings
3. **Browse the live Derive options chain** and select a put option strike/expiry
4. **Calculate net cost** — yield minus option premium (target: zero or positive)
5. **Visualize protection** — see your liquidation price and covered range

---

## UI Sections

| Section | ID | Description |
|---|---|---|
| Ticker Board | `#deribit-realtime-ticker-board` | Live price strip at page top |
| Hero | `#hero-section` | Full-screen video hero with CTA |
| Concept | — | Protocol explainer cards |
| Architecture | `#architecture-section` | 4-column technical breakdown |
| Footer | `#page-footer` | Links and status |

---

## License

This project is licensed under the **Apache-2.0 License**.  
See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**© 2026 AUTOMEEP LABS. ALL GUARANTEES HEDGED.**

*Built for Solana. Powered by Kamino & Derive.*

</div>

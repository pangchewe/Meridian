/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Hero } from "./components/Hero";
import { Concept } from "./components/Concept";
import { Architecture } from "./components/Architecture";
import { InteractiveWidget } from "./components/InteractiveWidget";
import { motion, AnimatePresence } from "motion/react";
import { X, Info, ShieldAlert, BadgeInfo } from "lucide-react";
import { useDeribitWS } from "./hooks/useDeribitWS";
import { RealtimeTickerBoard } from "./components/RealtimeTickerBoard";
import { useKaminoRates } from "./hooks/useKaminoRates";

export default function App() {
  const [isSimulationOpen, setIsSimulationOpen] = useState<boolean>(false);
  const [activeInfoTopic, setActiveInfoTopic] = useState<string | null>(null);

  // Initialize unified Deribit WebSocket connection
  const { connected, connecting, solPrice, btcPrice, ethPrice, optionChain } = useDeribitWS();

  // Initialize real-time Kamino APY rates
  const { rates: kaminoRates } = useKaminoRates();

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getTopicDescription = (topic: string) => {
    switch (topic) {
      case "Kamino Yield":
        return {
          title: "Kamino Automated Yield Optimized Route",
          description: "By deploying SOL tokens onto Kamino's high-efficiency liquidity vaults, we capture high-yield base parameters. The accumulated yield is dynamically harvested on an epoch basis and instantly routed inside our options vault to purchase Derive out-of-the-money put contracts.",
          bullets: [
            "Real-time Automated APY harvesting directly inside the yield routers.",
            "Complete capital exposure coverage (retaining primary borrowed principal).",
            "Automatic rebalancing matching market index fluctuations seamlessly.",
          ]
        };
      case "Derive Options":
        return {
          title: "Derive Protocol Deep Protection Options",
          description: "Options provide the ultimate guarantee against liquidation black swans. This module uses Kamino yields to procure fully underwritten OTM (Out-of-the-Money) Put Options from Derive. If price decreases past safety thresholds, your option exercises atomically, filling collateral requirements immediately.",
          bullets: [
            "Smart-hedging matching options strike duration to loan maturation lengths.",
            "Zero counterparty insolvency risk through fully collateralized underwriters.",
            "Dynamic hedging premium optimizer securing cost-friendly options.",
          ]
        };
      case "Smart Router":
        return {
          title: "Atomic Cross-Protocol Guard Router",
          description: "The engine links Solana lending parameters, Kamino supply, and Derive liquidity. By communicating through high-speed blockchain state channels, it monitors loan health factors and automatically covers debt or exercises option shields on any flash loan liquidation threat.",
          bullets: [
            "Zero manual inputs required — continuous background protection.",
            "Flash-crash trigger mechanism ensuring instantaneous option executes.",
            "Maximum yield efficiency keeping your actual costs at exact zero.",
          ]
        };
      default:
        return null;
    }
  };

  const activeTopicDetails = activeInfoTopic ? getTopicDescription(activeInfoTopic) : null;

  return (
    <main className="bg-black text-[#E1E0CC] min-h-screen relative font-sans overflow-x-hidden selection:bg-primary selection:text-black">
      {/* Real-time Ticker Board at the very top */}
      <RealtimeTickerBoard
        solPrice={solPrice}
        btcPrice={btcPrice}
        ethPrice={ethPrice}
        connected={connected}
        connecting={connecting}
        kaminoSolLendApy={kaminoRates?.solLendApy}
      />

      {/* 3 Core Cinematic Sections */}
      <Hero
        onProtectLoan={() => setIsSimulationOpen(true)}
        onScrollToSection={handleScrollToSection}
      />
      
      <Concept />
      
      <Architecture
        onLearnMore={(topic) => setActiveInfoTopic(topic)}
      />

      {/* Main Interactive dApp Simulation Modal */}
      <InteractiveWidget
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        liveSolPrice={solPrice}
        liveOptionChain={optionChain}
        liveConnected={connected}
        liveConnecting={connecting}
        kaminoRates={kaminoRates}
      />

      {/* Learn More Topic Modal overlay */}
      <AnimatePresence>
        {activeTopicDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveInfoTopic(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="info-modal-backdrop"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-lg bg-[#141413] border border-[#2A2A28] rounded-2xl p-6 sm:p-8 text-[#E1E0CC] shadow-2xl z-10"
              id="info-detail-modal"
            >
              {/* Close pin */}
              <button
                onClick={() => setActiveInfoTopic(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                title="Close"
                id="close-info-modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-primary">
                <BadgeInfo size={18} className="text-primary animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest uppercase">TECHNICAL BRIEFING</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-3">
                {activeTopicDetails.title}
              </h3>
              
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
                {activeTopicDetails.description}
              </p>

              <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-[#232321]">
                <h4 className="text-[11px] font-mono font-semibold tracking-wider text-primary uppercase">
                  CORE TECHNICAL PROTOCOLS
                </h4>
                <ul className="space-y-2 text-xs">
                  {activeTopicDetails.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  setActiveInfoTopic(null);
                  setIsSimulationOpen(true);
                }}
                className="w-full bg-primary hover:bg-primary/95 text-black text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-lg mt-6 transition-all duration-300"
                id="modal-cta-btn"
              >
                LAUNCH SIMULATION & HEDGE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Human, Humble, Aesthetic Footer */}
      <footer className="bg-[#080808] border-t border-[#1C1C1A] py-12 px-6 sm:px-12 text-center" id="page-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
            <span>AUTOMEEP CORES RUNNING SECURELY</span>
          </div>
          <div>
            <span>© 2026 AUTOMEEP LABS. ALL GUARANTEES HEDGED.</span>
          </div>
          <div className="flex gap-4">
            <a href="#hero-section" className="hover:text-primary transition-colors">BACK TO UPPER BASE</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

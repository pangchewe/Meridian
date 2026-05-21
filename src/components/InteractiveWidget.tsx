/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, ArrowRight, TrendingUp, Cpu, Info, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { DeribitOption } from "../hooks/useDeribitWS";

interface InteractiveWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  liveSolPrice: number;
  liveOptionChain: DeribitOption[];
  liveConnected: boolean;
  liveConnecting: boolean;
  kaminoRates?: {
    solLendApy: number;
    solBorrowApy: number;
    solMaxLtv: number;
    usdcLendApy: number;
    usdcBorrowApy: number;
    usdcMaxLtv: number;
  };
}

export function InteractiveWidget({
  isOpen,
  onClose,
  liveSolPrice,
  liveOptionChain,
  liveConnected,
  liveConnecting,
  kaminoRates
}: InteractiveWidgetProps) {
  // Mode selection: true = Live Deribit, false = Manual Sandbox
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [productMode, setProductMode] = useState<"borrower" | "supplier">("borrower");

  // Manual inputs (used when isLiveMode is false)
  const [manualSolPrice, setManualSolPrice] = useState<number>(85.16);

  // Position and loan inputs
  const [solAmount, setSolAmount] = useState<number>(100);
  const [borrowAmount, setBorrowAmount] = useState<number>(4500); // New Borrow amount (USDC)

  // Yield inputs
  const [lendApy, setLendApy] = useState<number>(6.5); // Kamino Lend APY
  const [borrowApy, setBorrowApy] = useState<number>(7.0); // Kamino Borrow APY
  const [maxLtv, setMaxLtv] = useState<number>(75); // Kamino Max LTV Limit (e.g. 75%)

  // Custom strike price selection states
  const [isCustomStrike, setIsCustomStrike] = useState<boolean>(false);
  const [customStrike, setCustomStrike] = useState<number>(0);

  // Sync state with real-time Kamino rates in Live Mode
  useEffect(() => {
    if (isLiveMode && kaminoRates) {
      setLendApy(Number(kaminoRates.solLendApy.toFixed(2)));
      setBorrowApy(Number(kaminoRates.usdcBorrowApy.toFixed(2)));
      setMaxLtv(Number(kaminoRates.solMaxLtv.toFixed(0)));
    }
  }, [isLiveMode, kaminoRates]);

  // Resolve current SOL price
  const solPrice = isLiveMode ? (liveSolPrice > 0 ? liveSolPrice : 85.16) : manualSolPrice;

  // Reset custom strike toggles when switching modes
  useEffect(() => {
    setIsCustomStrike(false);
  }, [productMode]);

  // 1. Setup Calculations
  const collateralValue = solAmount * solPrice;
  const currentLtv = productMode === "borrower" && collateralValue > 0 
    ? (borrowAmount / collateralValue) * 100 
    : 0;
  
  // Set borrow amount to 0 when in supplier mode
  const effectiveBorrowAmount = productMode === "borrower" ? borrowAmount : 0;
  
  // Liquidation Price / Protection Strike
  // For Borrower mode, Liquidation Price = borrowAmount / (solAmount * MaxLTV)
  // For Supplier mode, Target Strike Price is tight, e.g. 90% of spot price (Yield + Principal Protection)
  const liquidationPrice = solAmount > 0 && maxLtv > 0 ? effectiveBorrowAmount / (solAmount * (maxLtv / 100)) : 0;

  const defaultStrikePrice = productMode === "borrower"
    ? liquidationPrice
    : solPrice * 0.90;

  // Auto-sync custom strike state to default strike when custom mode is off or parameters change
  useEffect(() => {
    if (!isCustomStrike) {
      setCustomStrike(Math.round(defaultStrikePrice));
    }
  }, [defaultStrikePrice, isCustomStrike]);

  const targetStrikePrice = isCustomStrike ? customStrike : defaultStrikePrice;

  // 2. Put Option Matching Engine (Deribit Live data search)
  // Sandbox premium estimator: puts closer to spot are more expensive (higher delta)
  const estimateSandboxPremium = (strike: number, spot: number): number => {
    if (spot <= 0) return 0.10;
    const moneyness = strike / spot; // 0 = deep OTM, 1 = ATM
    // Exponential premium curve: deep OTM ~$0.05, near ATM ~$2.50
    const raw = 0.05 * Math.exp(moneyness * 5.2);
    return Math.max(0.02, Math.min(5.0, parseFloat(raw.toFixed(2))));
  };

  const matchingOptionDetails = useMemo(() => {
    if (!isLiveMode || liveOptionChain.length === 0) {
      // Sandbox fallback: premium scales with strike proximity to spot
      const strike = Math.round(targetStrikePrice);
      const premium = estimateSandboxPremium(strike, solPrice);
      return {
        instrument_name: `SOL-26JUN26-${strike}-P`,
        expiryStr: "26JUN26",
        daysToExpiry: 36,
        strike: strike,
        type: "P" as const,
        mark_price: premium,
        bid_price: parseFloat((premium * 0.95).toFixed(2)),
        ask_price: premium,
        isFallback: true
      };
    }

    // Filter only Put options
    const puts = liveOptionChain.filter(opt => opt.type === "P");
    if (puts.length === 0) {
      const strike = Math.round(targetStrikePrice);
      return {
        instrument_name: `SOL-26JUN26-${strike}-P`,
        expiryStr: "26JUN26",
        daysToExpiry: 36,
        strike: strike,
        type: "P" as const,
        mark_price: 0.40,
        bid_price: 0.38,
        ask_price: 0.40,
        isFallback: true
      };
    }

    // Find expiries and locate the one closest to 30 days
    const uniqueExpiries = Array.from(new Set(puts.map(p => p.expiryStr)));
    let bestExpiryStr = uniqueExpiries[0];
    let minExpiryDiff = Infinity;
    
    uniqueExpiries.forEach(exp => {
      const opt = puts.find(p => p.expiryStr === exp);
      if (opt) {
        const diff = Math.abs(opt.daysToExpiry - 30);
        if (diff < minExpiryDiff) {
          minExpiryDiff = diff;
          bestExpiryStr = exp;
        }
      }
    });

    // Filter puts for this best expiry
    const expiryPuts = puts.filter(p => p.expiryStr === bestExpiryStr);
    
    // Find the put option with a strike closest to our calculated targetStrikePrice
    let closestPut = expiryPuts[0];
    let minStrikeDiff = Infinity;

    expiryPuts.forEach(p => {
      const diff = Math.abs(p.strike - targetStrikePrice);
      if (diff < minStrikeDiff) {
        minStrikeDiff = diff;
        closestPut = p;
      }
    });

    if (!closestPut) {
      const strike = Math.round(targetStrikePrice);
      return {
        instrument_name: `SOL-26JUN26-${strike}-P`,
        expiryStr: "26JUN26",
        daysToExpiry: 36,
        strike: strike,
        type: "P" as const,
        mark_price: 0.40,
        bid_price: 0.38,
        ask_price: 0.40,
        isFallback: true
      };
    }

    return {
      ...closestPut,
      isFallback: false
    };
  }, [isLiveMode, liveOptionChain, targetStrikePrice, solPrice]);

  // Option Ask Premium per SOL
  // Fall back to mark price if ask price is not available
  const optionAskPremium = matchingOptionDetails.ask_price !== null 
    ? matchingOptionDetails.ask_price 
    : (matchingOptionDetails.mark_price || 0.40);

  // 3. Financial calculations
  const totalPutPremium = solAmount * optionAskPremium;

  // Monthly yield income from Kamino Supply
  const lendYieldMonthly = collateralValue * (lendApy / 100) / 12;

  // Fee 1: 20% Performance Fee — skimmed from Kamino yield before buying option
  // Inspired by Yearn's "2 and 20" model. Taken from "free money" so users don't feel it.
  const performanceFee = lendYieldMonthly * 0.20;
  const yieldAfterPerformanceFee = lendYieldMonthly - performanceFee;

  // Fee 2: 0.1% Origination Fee — one-time fee on total collateral value at deploy
  // "Whale Tax": a $100k deposit instantly generates $100 in protocol revenue.
  const originationFee = collateralValue * 0.001;

  // Total option insurance cost (no longer inflated by a % on the option itself)
  const totalInsuranceCost = totalPutPremium;

  // Monthly debt cost from Kamino Borrow
  const borrowCostMonthly = effectiveBorrowAmount * (borrowApy / 100) / 12;

  // Net Yield after performance fee skim
  const netYieldMonthly = yieldAfterPerformanceFee - borrowCostMonthly;

  // Net Out-of-Pocket (yield after fees minus option premium)
  const netOutOfPocket = netYieldMonthly - totalInsuranceCost;

  // LTV Alert check
  const isLtvRisky = productMode === "borrower" && currentLtv >= maxLtv - 10;
  const isLtvLiquidated = productMode === "borrower" && currentLtv >= maxLtv;

  // List of other options in the same expiry for custom orderbook visualizer
  const siblingPuts = useMemo(() => {
    if (!isLiveMode || liveOptionChain.length === 0) {
      // Generate 5 dynamic sandbox options centered around current target strike
      const center = Math.round(targetStrikePrice / 5) * 5; // round to nearest $5
      const strikes = [-10, -5, 0, 5, 10].map(offset => Math.max(5, center + offset));
      return strikes.map(s => {
        const ask = estimateSandboxPremium(s, solPrice);
        return {
          strike: s,
          ask,
          bid: parseFloat((ask * 0.95).toFixed(2)),
          code: `SOL-26JUN26-${s}-P`
        };
      });
    }

    const puts = liveOptionChain.filter(
      opt => opt.type === "P" && opt.expiryStr === matchingOptionDetails.expiryStr
    );

    // Sort by strike and take the 5 closest strikes to our liquidation strike
    return puts
      .sort((a, b) => Math.abs(a.strike - targetStrikePrice) - Math.abs(b.strike - targetStrikePrice))
      .slice(0, 5)
      .sort((a, b) => a.strike - b.strike)
      .map(p => ({
        strike: p.strike,
        ask: p.ask_price || p.mark_price || 0.1,
        bid: p.bid_price || p.mark_price * 0.95 || 0.09,
        code: p.instrument_name
      }));
  }, [isLiveMode, liveOptionChain, matchingOptionDetails.expiryStr, targetStrikePrice, solPrice]);

  // Lock body scroll on mount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            id="modal-backdrop"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.12 }}
            className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0E0E0E] border border-[#2A2A28] rounded-2xl shadow-2xl p-5 sm:p-7 text-[#E1E0CC] z-10"
            id="simulation-modal"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
              title="Close Modal"
              id="close-modal-btn"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232321] pb-5 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary animate-pulse">
                  <Shield size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight uppercase">Automeep Hedging Core</h3>
                  <p className="text-[10px] text-gray-500 font-mono tracking-wider">KAMINO YIELD + DERIBIT LIVE PORTFOLIO INSURER</p>
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex items-center bg-[#151514] border border-[#2A2A28] p-0.5 rounded-lg text-[10px] font-mono shrink-0">
                <button
                  onClick={() => setIsLiveMode(false)}
                  className={`px-3 py-1.5 rounded-md transition-all uppercase ${
                    !isLiveMode
                      ? "bg-[#252523] text-primary font-bold shadow-sm"
                      : "text-gray-500 hover:text-[#DEDBC8]"
                  }`}
                  id="sandbox-mode-btn"
                >
                  MANUAL SANDBOX
                </button>
                <button
                  onClick={() => setIsLiveMode(true)}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 uppercase ${
                    isLiveMode
                      ? "bg-[#252523] text-primary font-bold shadow-sm"
                      : "text-gray-500 hover:text-[#DEDBC8]"
                  }`}
                  id="live-mode-btn"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${liveConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400 animate-pulse"}`} />
                  LIVE DERIBIT
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Sliders & Controls */}
              <div className="lg:col-span-5 space-y-4 bg-[#141413] p-4 sm:p-5 rounded-xl border border-[#232321]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-primary border-b border-[#2A2A28] pb-1.5 mb-2.5 flex items-center justify-between">
                  <span>LOAN & YIELD CONFIGURATION</span>
                  {isLiveMode && (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      LIVE INDEX CONNECTED
                    </span>
                  )}
                </h4>

                {/* Product Mode Switcher */}
                <div className="flex bg-black/50 border border-[#2A2A28] p-1 rounded-xl text-[10px] font-mono mb-4 w-full">
                  <button
                    onClick={() => setProductMode("borrower")}
                    className={`flex-1 py-2 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      productMode === "borrower"
                        ? "bg-primary text-black font-bold"
                        : "text-gray-500 hover:text-[#DEDBC8]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">Borrower Mode</span>
                    <span className="text-[8px] opacity-80 uppercase tracking-widest font-semibold">Automeep Shield</span>
                  </button>
                  <button
                    onClick={() => setProductMode("supplier")}
                    className={`flex-1 py-2 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      productMode === "supplier"
                        ? "bg-primary text-black font-bold"
                        : "text-gray-500 hover:text-[#DEDBC8]"
                    }`}
                    id="no-borrow-btn"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">Supplier Mode</span>
                    <span className="text-[8px] opacity-80 uppercase tracking-widest font-semibold">Capital Safe (No-Borrow)</span>
                  </button>
                </div>

                {/* SOL Index Price Input (Manual Only) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">SOL INDEX PRICE</span>
                    <span className={isLiveMode ? "text-emerald-400 font-bold" : "text-primary"}>
                      ${solPrice.toFixed(2)} USD {isLiveMode && "(LIVE)"}
                    </span>
                  </div>
                  {!isLiveMode ? (
                    <>
                      <input
                        type="range"
                        min="20"
                        max="250"
                        step="0.5"
                        value={manualSolPrice}
                        onChange={(e) => setManualSolPrice(Number(e.target.value))}
                        className="w-full accent-primary bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                        id="manual-sol-price-slider"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-gray-500">
                        <span>$20</span>
                        <span>$250</span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-black/30 border border-[#2A2A28]/50 p-2.5 rounded-lg text-[11px] text-gray-400 font-mono leading-relaxed">
                      Deribit WebSockets is dynamically feeding the spot price. To customize the price, toggle to <span className="text-primary">MANUAL SANDBOX</span> above.
                    </div>
                  )}
                </div>

                {/* SOL Supply Collateral */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">SOL SUPPLY COLLATERAL</span>
                    <span className="text-primary font-bold">{solAmount.toLocaleString()} SOL</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="5"
                    value={solAmount}
                    onChange={(e) => setSolAmount(Number(e.target.value))}
                    className="w-full accent-primary bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="sol-amount-slider"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>10 SOL (${(10 * solPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                    <span>1,000 SOL (${(1000 * solPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                  </div>
                </div>

                {/* USDC Borrow Amount or Supplier Active card */}
                {productMode === "supplier" ? (
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-[11px] text-gray-400 font-sans leading-relaxed my-2">
                    <div className="text-primary font-bold uppercase tracking-wider mb-0.5">🛡️ Supplier Mode Active</div>
                    You are supplying <span className="text-white font-semibold">{solAmount} SOL</span> to earn Kamino yield. You have zero debt, meaning <span className="text-emerald-400 font-bold">no liquidation risk</span>. All earned yield is automatically routed to buy Derive put options to secure your principal!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">USDC BORROW VALUE</span>
                      <span className="text-primary font-bold">${borrowAmount.toLocaleString()} USDC</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="20000"
                      step="100"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(Number(e.target.value))}
                      className="w-full accent-primary bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                      id="borrow-amount-slider"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-gray-500">
                      <span>$100</span>
                      <span>$20,000</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1.5">
                  {/* Kamino Lend APY */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-gray-500">LEND APY {isLiveMode && "(LIVE)"}</span>
                      <span className="text-emerald-400 font-bold">{lendApy}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="0.1"
                      value={lendApy}
                      onChange={(e) => setLendApy(Number(e.target.value))}
                      disabled={isLiveMode}
                      className={`w-full accent-emerald-500 bg-black/40 h-1 rounded-lg appearance-none ${
                        isLiveMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                      id="lend-apy-slider"
                    />
                  </div>

                  {/* Kamino Borrow APY */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-gray-500">BORROW APY {isLiveMode && "(LIVE)"}</span>
                      <span className="text-rose-400 font-bold">{borrowApy}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="0.1"
                      value={borrowApy}
                      onChange={(e) => setBorrowApy(Number(e.target.value))}
                      disabled={isLiveMode}
                      className={`w-full accent-rose-500 bg-black/40 h-1 rounded-lg appearance-none ${
                        isLiveMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                      id="borrow-apy-slider"
                    />
                  </div>
                </div>

                {/* Kamino Max LTV */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">KAMINO LIQUIDATION LTV LIMIT {isLiveMode && "(LIVE)"}</span>
                    <span className="text-[#DEDBC8] font-bold">{maxLtv}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="90"
                    step="1"
                    value={maxLtv}
                    onChange={(e) => setMaxLtv(Number(e.target.value))}
                    disabled={isLiveMode}
                    className={`w-full accent-[#DEDBC8] bg-black/40 h-1.5 rounded-lg appearance-none ${
                      isLiveMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    }`}
                    id="max-ltv-slider"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>60% (Conservative)</span>
                    <span>90% (Degenerate)</span>
                  </div>
                </div>

                {/* Custom Protection Strike Override */}
                <div className="space-y-2 pt-2 border-t border-[#232321]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
                      CUSTOM PROTECTION STRIKE
                    </span>
                    <button
                      onClick={() => setIsCustomStrike(!isCustomStrike)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isCustomStrike ? "bg-primary" : "bg-[#252523]"
                      }`}
                      id="custom-strike-toggle"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          isCustomStrike ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {isCustomStrike && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">SELECTED PUT STRIKE</span>
                        <span className="text-primary font-bold">${customStrike} USD</span>
                      </div>
                      <input
                        type="range"
                        min={productMode === "borrower" ? 10 : Math.round(solPrice * 0.5)}
                        max={Math.round(solPrice * 0.98)}
                        step="1"
                        value={customStrike}
                        onChange={(e) => setCustomStrike(Number(e.target.value))}
                        className="w-full accent-primary bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                        id="custom-strike-slider"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-gray-500">
                        <span>${productMode === "borrower" ? 10 : Math.round(solPrice * 0.5)}</span>
                        <span>${Math.round(solPrice * 0.98)}</span>
                      </div>

                      {/* Educational inline alert */}
                      {productMode === "borrower" ? (
                        customStrike < Math.round(liquidationPrice) ? (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2 rounded text-[10px] leading-relaxed">
                            ⚠️ <strong>UNDER-HEDGED:</strong> Your selected strike (${customStrike}) is below your liquidation price (${Math.round(liquidationPrice)}). You will be liquidated before this option shield exercises!
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded text-[10px] leading-relaxed">
                            ✅ <strong>FULLY SHIELDED:</strong> Your strike price covers your liquidation threshold, ensuring complete capital preservation.
                          </div>
                        )
                      ) : (
                        customStrike < Math.round(solPrice * 0.8) ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded text-[10px] leading-relaxed">
                            ⚠️ <strong>LOW SHIELD:</strong> Your principal floor is very low. A major crash could result in up to {Math.round((1 - customStrike/solPrice)*100)}% loss before protection kicks in.
                          </div>
                        ) : customStrike >= Math.round(solPrice * 0.95) ? (
                          <div className="bg-primary/10 border border-primary/20 text-primary p-2 rounded text-[10px] leading-relaxed">
                            💎 <strong>ULTRA-SHIELDED:</strong> Virtually 100% of your principal is secured, but option premiums will consume most of your Kamino yield.
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded text-[10px] leading-relaxed">
                            ✅ <strong>BALANCED HEDGE:</strong> Healthy capital floor protection with high cashflow yield efficiency.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Live Orderbook depth display */}
                <div className="pt-2 border-t border-[#232321]">
                  <div className="text-[10px] font-mono text-gray-500 uppercase mb-2 tracking-wider">
                    {isLiveMode ? "DERIBIT LIVE ORDER DEPTH (PUTS)" : "SIMULATED ORDER DEPTH (PUTS)"}
                  </div>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="grid grid-cols-12 text-gray-500 border-b border-[#232321] pb-1 font-semibold">
                      <span className="col-span-5">INSTRUMENT CODE</span>
                      <span className="col-span-3 text-right">STRIKE</span>
                      <span className="col-span-2 text-right text-emerald-400">BID</span>
                      <span className="col-span-2 text-right text-rose-400 font-bold">ASK</span>
                    </div>
                    {siblingPuts.map((p, index) => {
                      const isSelected = p.strike === matchingOptionDetails.strike;
                      return (
                        <div
                          key={index}
                          className={`grid grid-cols-12 py-1 px-1 rounded transition-colors ${
                            isSelected 
                              ? "bg-primary/10 border border-primary/20 text-primary font-bold" 
                              : "text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <span className="col-span-5 truncate">{p.code}</span>
                          <span className="col-span-3 text-right">${p.strike}</span>
                          <span className="col-span-2 text-right text-emerald-400/90">${p.bid.toFixed(2)}</span>
                          <span className="col-span-2 text-right text-rose-400/90 font-bold">${p.ask.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic calculations, Net Table & CTAs */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                
                {/* Visual state headers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Collateral Value Card */}
                  <div className="bg-[#141413] border border-[#232321] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase">PORTFOLIO VALUE</span>
                    <div className="text-base sm:text-lg font-bold text-[#DEDBC8] mt-1">${collateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1">100% COLLATERAL</span>
                  </div>

                  {/* LTV Safety Card / Protection Status Card */}
                  {productMode === "supplier" ? (
                    <div className="bg-[#141413] border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase">PROTECTION STATUS</span>
                      <div className="text-sm sm:text-base font-bold mt-1 uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping" />
                        CAPITAL SAFE
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1">NO LIQ RISK (SUPPLIER)</span>
                    </div>
                  ) : (
                    <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
                      isLtvLiquidated 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : isLtvRisky
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-[#141413] border-[#232321] text-emerald-400"
                    }`}>
                      <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase">CURRENT LTV</span>
                      <div className="text-base sm:text-lg font-bold mt-1">{currentLtv.toFixed(1)}%</div>
                      <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1">LIMIT: {maxLtv}% LTV</span>
                    </div>
                  )}

                  {/* Liquidation Strike Card / Bear Shield Strike Card */}
                  <div className="bg-[#141413] border border-[#232321] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase">
                      {productMode === "supplier" 
                        ? (isCustomStrike ? "CUSTOM BEAR SHIELD" : "BEAR SHIELD STRIKE") 
                        : (isCustomStrike ? "HEDGE SHIELD STRIKE" : "LIQUIDATION PRICE")}
                    </span>
                    <div className="text-base sm:text-lg font-bold text-rose-400 mt-1">
                      ${targetStrikePrice.toFixed(2)}
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1">
                      {productMode === "supplier" 
                        ? (isCustomStrike ? "CUSTOM PRINCIPAL SHIELD" : "90% PRINCIPAL SHIELD") 
                        : (isCustomStrike ? `LIQ LEVEL: $${liquidationPrice.toFixed(1)}` : "SHIELD STRIKE LEVEL")}
                    </span>
                  </div>
                </div>

                {/* Option Matching Banner */}
                <div className="bg-[#1C1C1A] border border-[#2A2A28] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Cpu size={14} className="text-primary animate-pulse" />
                      <span className="text-[10px] font-mono tracking-wider uppercase font-bold">MATCHING DERIBIT PUT SHIELD</span>
                    </div>
                    <div className="text-sm font-bold text-white tracking-tight">{matchingOptionDetails.instrument_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      EXPIRY: {matchingOptionDetails.expiryStr} ({Math.round(matchingOptionDetails.daysToExpiry)} DAYS) • STRIKE: ${matchingOptionDetails.strike}
                    </div>
                  </div>
                  <div className="bg-black/40 border border-[#232321] p-2.5 rounded-lg text-right w-full sm:w-auto shrink-0 font-mono">
                    <div className="text-[9px] text-gray-500">LIVE ASK PREMIUM</div>
                    <div className="text-sm font-bold text-primary">${optionAskPremium.toFixed(2)} <span className="text-[9px] text-gray-500">USDC / SOL</span></div>
                  </div>
                </div>

                {/* LTV warning banners */}
                {isLtvLiquidated ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg flex items-start gap-2.5 text-xs leading-snug">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>CRITICAL LIQUIDATION DANGER</strong>: Your current LTV ({currentLtv.toFixed(1)}%) is above the max threshold ({maxLtv}%). In a live scenario, your collateral would already be sold. Deploying protection now exercises option shields instantly!
                    </div>
                  </div>
                ) : isLtvRisky ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg flex items-start gap-2.5 text-xs leading-snug">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>HIGH LTV WARNING</strong>: Your LTV of {currentLtv.toFixed(1)}% is approaching the liquidation limit of {maxLtv}%. Purchasing a put option is highly recommended to protect your primary capital.
                    </div>
                  </div>
                ) : null}

                {/* Math Breakdown Table */}
                <div className="bg-black/50 border border-[#2A2A28] rounded-xl p-4 sm:p-5 space-y-4">
                  <h5 className="text-[10px] uppercase font-mono tracking-widest text-[#DEDBC8] border-b border-[#232321] pb-2 font-bold">
                    AUTOMEEP MONTHLY CASHFLOW LEDGER
                  </h5>

                  <div className="space-y-2.5 text-xs font-mono">
                    {/* Kamino Supply Yield — Gross */}
                    <div className="flex justify-between items-center text-gray-400">
                      <span>1. Kamino Gross Yield ({lendApy}% APY on SOL)</span>
                      <span className="text-emerald-400 font-bold">+${lendYieldMonthly.toFixed(2)}/mo</span>
                    </div>

                    {/* Performance Fee: 20% skim of gross yield */}
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="flex items-center gap-1">
                        2. Protocol Performance Fee
                        <span className="text-[8px] bg-primary/15 text-primary border border-primary/20 px-1 py-0.5 rounded font-bold">20% SKIM</span>
                      </span>
                      <span className="text-amber-400 font-bold">−${performanceFee.toFixed(2)}/mo</span>
                    </div>

                    {/* Kamino Borrow Cost */}
                    {productMode === "borrower" && (
                      <div className="flex justify-between items-center text-gray-400">
                        <span>3. Kamino Borrow Expense ({borrowApy}% APY on USDC Debt)</span>
                        <span className="text-rose-400 font-bold">−${borrowCostMonthly.toFixed(2)}/mo</span>
                      </div>
                    )}

                    {/* Net Yield after skim */}
                    <div className="flex justify-between items-center border-t border-[#232321]/60 pt-2 font-bold">
                      <span className="text-[#DEDBC8]">
                        {productMode === "supplier" ? "Net Yield After Protocol Skim" : "Net Yield After Fees"}
                      </span>
                      <span className={netYieldMonthly >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {netYieldMonthly >= 0 ? "+" : ""}${netYieldMonthly.toFixed(2)}/mo
                      </span>
                    </div>

                    {/* Put Premium */}
                    <div className="flex justify-between items-center text-gray-400 pt-1.5">
                      <span>
                        {productMode === "supplier" ? "4. Derive Put Premium" : "4. Deribit Put Premium"} (SOL-${matchingOptionDetails.strike}-P)
                      </span>
                      <span className="text-rose-400">−${totalPutPremium.toFixed(2)}</span>
                    </div>

                    {/* Origination Fee (one-time) */}
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="flex items-center gap-1">
                        5. Vault Origination Fee
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-bold">0.1% · ONE-TIME</span>
                      </span>
                      <span className="text-amber-400">−${originationFee.toFixed(2)}</span>
                    </div>

                    {/* Final Net Cashflow Ledger */}
                    <div className="flex justify-between items-center border-t border-primary/20 pt-3 text-sm font-sans font-bold">
                      <span className="text-primary flex items-center gap-1.5 uppercase tracking-wide">
                        <TrendingUp size={14} className="text-primary" />
                        Net Monthly Out-of-Pocket
                      </span>
                      <span className={netOutOfPocket >= 0 ? "text-emerald-400 font-mono" : "text-primary font-mono"}>
                        {netOutOfPocket >= 0
                          ? `+$${netOutOfPocket.toFixed(2)}/mo (100% FREE)`
                          : `−$${Math.abs(netOutOfPocket).toFixed(2)}/mo`}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar representation */}
                  <div className="space-y-1.5 pt-2 border-t border-[#232321]">
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>HEDGE SUBSIDY SHIELD EFFICIENCY</span>
                      <span className="font-bold text-primary">
                        {totalInsuranceCost > 0 
                          ? Math.min(100, Math.max(0, (lendYieldMonthly / totalInsuranceCost) * 100)).toFixed(1)
                          : "100.0"}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 border border-[#2A2A28] bg-black/40 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${totalInsuranceCost > 0 
                            ? Math.min(100, Math.max(0, (lendYieldMonthly / totalInsuranceCost) * 100))
                            : 100}%` 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {productMode === "supplier" ? (
                  <div className="bg-[#141413] border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b border-[#232321] pb-2">
                      <div className="p-1 rounded bg-primary/10 border border-primary/20 text-primary">
                        <Shield size={14} className="text-primary animate-pulse" />
                      </div>
                      <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-primary">
                        🛡️ Capital Safe Mechanics At Work
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-sans">
                      {/* Bull Market */}
                      <div className="bg-emerald-950/15 border border-emerald-500/10 rounded-lg p-3 space-y-1.5 hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <TrendingUp size={13} />
                          <span>BULL MARKET (SOL Up)</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-[10.5px]">
                          You capture <strong className="text-[#DEDBC8]">100% of the upside</strong> on your {solAmount} SOL. If SOL doubles, your capital doubles!
                        </p>
                        <div className="text-[9.5px] font-mono bg-emerald-500/5 px-2 py-1 rounded text-emerald-400/80 border border-emerald-500/5 leading-relaxed">
                          Kamino Yield (${lendYieldMonthly.toFixed(2)}/mo) pays the premium for zero out-of-pocket downside protection.
                        </div>
                      </div>

                      {/* Bear Market */}
                      <div className="bg-rose-950/15 border border-rose-500/10 rounded-lg p-3 space-y-1.5 hover:border-rose-500/20 transition-all">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <Shield size={13} />
                          <span>BEAR MARKET (Crash)</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-[10.5px]">
                          Your SOL value falls, but the **Derive Put Option** automatically pays out in USDC to offset the loss!
                        </p>
                        <div className="text-[9.5px] font-mono bg-rose-500/5 px-2 py-1 rounded text-rose-400/80 border border-rose-500/5 leading-relaxed">
                          Floor Value: <strong className="text-white">${(solAmount * targetStrikePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</strong>. You never lose your initial principal.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A1A14] border border-primary/10 rounded-xl p-3.5 flex gap-2.5 text-[11px] text-gray-400 leading-relaxed font-sans">
                    <Info size={15} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      {isLiveMode ? (
                        <span>
                          Our system scans the **Deribit orderbook** in real-time. By matching your Kamino liquidation price to option strike prices, we buy exactly the right Put Options. The monthly premiums are paid from your Kamino lend yields.
                        </span>
                      ) : (
                        <span>
                          **Sandbox Mode Active**: Prices and calculations are models. Enable **LIVE DERIBIT** above to connect to live WebSockets and search the real option orderbook.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirm Shield Activating */}
                <button
                  onClick={() => {
                    if (productMode === "supplier") {
                      alert(
                        `🛡️ Capital Safe Protocol Deployed:\n` +
                        `- Collateral Supplied: ${solAmount} SOL (Value: $${collateralValue.toLocaleString(undefined, { minimumFractionDigits: 2 })})\n` +
                        `- Borrowed Debt: None (Zero-Risk Yield earning)\n` +
                        `- Bear Shield Strike (${isCustomStrike ? "Custom Principal Protection Floor" : "90% Principal Protection Floor"}): $${targetStrikePrice.toFixed(2)}/SOL\n` +
                        `- Derive Put Option: ${matchingOptionDetails.instrument_name} @ Ask $${optionAskPremium.toFixed(2)}/SOL\n` +
                        `─────────────────────────────\n` +
                        `💸 FEES CHARGED:\n` +
                        `- Vault Origination Fee (0.1%): $${originationFee.toFixed(2)} [ONE-TIME, NOW]\n` +
                        `- Protocol Performance Fee (20% yield skim): $${performanceFee.toFixed(2)}/mo\n` +
                        `─────────────────────────────\n` +
                        `- Net monthly out-of-pocket: ${netOutOfPocket >= 0 ? `+$${netOutOfPocket.toFixed(2)} (SELF-PAYING)` : `-$${Math.abs(netOutOfPocket).toFixed(2)}`}`
                      );
                    } else {
                      alert(
                        `🛡️ Dynamic Self-Paying borrower protection established:\n` +
                        `- Collateral Locked: ${solAmount} SOL\n` +
                        `- Borrowed Debt: $${borrowAmount} USDC\n` +
                        `- Liquidation Threshold: $${liquidationPrice.toFixed(2)}/SOL\n` +
                        `- Chosen Protection Strike: $${targetStrikePrice.toFixed(2)}/SOL (${isCustomStrike ? "Custom Strike" : "Auto Strike"})\n` +
                        `- Deribit Protection Put: ${matchingOptionDetails.instrument_name} @ Ask $${optionAskPremium.toFixed(2)}/SOL\n` +
                        `─────────────────────────────\n` +
                        `💸 FEES CHARGED:\n` +
                        `- Vault Origination Fee (0.1%): $${originationFee.toFixed(2)} [ONE-TIME, NOW]\n` +
                        `- Protocol Performance Fee (20% yield skim): $${performanceFee.toFixed(2)}/mo\n` +
                        `─────────────────────────────\n` +
                        `- Net monthly out-of-pocket: ${netOutOfPocket >= 0 ? `+$${netOutOfPocket.toFixed(2)} (SELF-PAYING)` : `-$${Math.abs(netOutOfPocket).toFixed(2)}`}`
                      );
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase py-3 px-6 rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-2 group tracking-widest cursor-pointer"
                  id="confirm-shield-btn"
                >
                  {productMode === "supplier" ? "DEPLOY CAPITAL SAFE PROTOCOL" : "DEPLOY PROTECTED DEBT PROTOCOL"}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

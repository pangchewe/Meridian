/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Activity } from "lucide-react";

interface RealtimeTickerBoardProps {
  solPrice: number;
  btcPrice: number;
  ethPrice: number;
  connected: boolean;
  connecting: boolean;
  kaminoSolLendApy?: number;
}

export function RealtimeTickerBoard({
  solPrice,
  btcPrice,
  ethPrice,
  connected,
  connecting,
  kaminoSolLendApy
}: RealtimeTickerBoardProps) {
  // Sol price tracking
  const [solChange, setSolChange] = useState<"up" | "down" | null>(null);
  const prevSolRef = useRef<number>(solPrice);

  // Btc price tracking
  const [btcChange, setBtcChange] = useState<"up" | "down" | null>(null);
  const prevBtcRef = useRef<number>(btcPrice);

  // Eth price tracking
  const [ethChange, setEthChange] = useState<"up" | "down" | null>(null);
  const prevEthRef = useRef<number>(ethPrice);

  useEffect(() => {
    if (solPrice > prevSolRef.current) {
      setSolChange("up");
      const t = setTimeout(() => setSolChange(null), 800);
      return () => clearTimeout(t);
    } else if (solPrice < prevSolRef.current) {
      setSolChange("down");
      const t = setTimeout(() => setSolChange(null), 800);
      return () => clearTimeout(t);
    }
    prevSolRef.current = solPrice;
  }, [solPrice]);

  useEffect(() => {
    if (btcPrice > prevBtcRef.current) {
      setBtcChange("up");
      const t = setTimeout(() => setBtcChange(null), 800);
      return () => clearTimeout(t);
    } else if (btcPrice < prevBtcRef.current) {
      setBtcChange("down");
      const t = setTimeout(() => setBtcChange(null), 800);
      return () => clearTimeout(t);
    }
    prevBtcRef.current = btcPrice;
  }, [btcPrice]);

  useEffect(() => {
    if (ethPrice > prevEthRef.current) {
      setEthChange("up");
      const t = setTimeout(() => setEthChange(null), 800);
      return () => clearTimeout(t);
    } else if (ethPrice < prevEthRef.current) {
      setEthChange("down");
      const t = setTimeout(() => setEthChange(null), 800);
      return () => clearTimeout(t);
    }
    prevBtcRef.current = ethPrice;
  }, [ethPrice]);

  return (
    <div
      className="w-full bg-black/40 border-b border-[#2A2A28]/40 backdrop-blur-md py-2.5 px-4 sm:px-6 select-none"
      id="deribit-realtime-ticker-board"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-[#DEDBC8]/70">
        
        {/* Network status */}
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider">DERIBIT WS LIVE CONNECTED</span>
            </span>
          ) : connecting ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <RefreshCw size={11} className="animate-spin text-amber-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">CONNECTING TO DERIBIT WS...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 animate-pulse"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider">DERIBIT WS OFFLINE (RECONNECTING)</span>
            </span>
          )}
          
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Activity size={10} />
            <span>REALTIME ORDERBOOK ESTIMATOR ACTIVE</span>
          </div>
        </div>

        {/* Live Index Tickers */}
        <div className="flex items-center flex-wrap justify-center gap-6 text-xs font-medium">
          
          {/* SOL Ticker */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">SOL:</span>
            <span
              className={`transition-all duration-300 font-bold ${
                solChange === "up"
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  : solChange === "down"
                  ? "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                  : "text-[#DEDBC8]"
              }`}
            >
              ${solPrice.toFixed(2)}
            </span>
            {solChange === "up" && <TrendingUp size={11} className="text-emerald-400 animate-bounce" />}
            {solChange === "down" && <TrendingDown size={11} className="text-rose-400 animate-bounce" />}
          </div>

          {/* BTC Ticker */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">BTC:</span>
            <span
              className={`transition-all duration-300 font-bold ${
                btcChange === "up"
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  : btcChange === "down"
                  ? "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                  : "text-[#DEDBC8]"
              }`}
            >
              ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {btcChange === "up" && <TrendingUp size={11} className="text-emerald-400 animate-bounce" />}
            {btcChange === "down" && <TrendingDown size={11} className="text-rose-400 animate-bounce" />}
          </div>

          {/* ETH Ticker */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">ETH:</span>
            <span
              className={`transition-all duration-300 font-bold ${
                ethChange === "up"
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  : ethChange === "down"
                  ? "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                  : "text-[#DEDBC8]"
              }`}
            >
              ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {ethChange === "up" && <TrendingUp size={11} className="text-emerald-400 animate-bounce" />}
            {ethChange === "down" && <TrendingDown size={11} className="text-rose-400 animate-bounce" />}
          </div>

          {/* Kamino SOL Lend APY Ticker */}
          {kaminoSolLendApy !== undefined && (
            <div className="flex items-center gap-2 border-l border-[#2A2A28]/80 pl-4">
              <span className="text-gray-500">KAMINO SOL LEND:</span>
              <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.25)] animate-pulse">
                {kaminoSolLendApy.toFixed(2)}% APY
              </span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Copy, LogOut, ChevronDown, Check } from "lucide-react";

export function WalletButton() {
  const { publicKey, disconnect, connecting, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  const handleCopy = useCallback(async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [publicKey]);

  const handleDisconnect = useCallback(async () => {
    setDropdownOpen(false);
    await disconnect();
  }, [disconnect]);

  // Not connected — show connect button
  if (!connected && !connecting) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 bg-primary text-black text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-4 py-2 rounded-full hover:bg-primary/90 transition-all duration-200 cursor-pointer shadow-md hover:shadow-primary/20 select-none"
        id="wallet-connect-btn"
      >
        <Wallet size={13} />
        Connect Wallet
      </button>
    );
  }

  // Connecting spinner
  if (connecting) {
    return (
      <div className="flex items-center gap-2 bg-[#1A1A18] border border-[#2A2A28] text-[#DEDBC8] text-[10px] font-mono px-3 sm:px-4 py-2 rounded-full select-none">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Connecting...
      </div>
    );
  }

  // Connected — show address dropdown
  return (
    <div className="relative" id="wallet-connected-container">
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#141413] border border-[#2A2A28] hover:border-primary/40 text-[#DEDBC8] text-[10px] sm:text-xs font-mono px-3 sm:px-4 py-2 rounded-full transition-all duration-200 cursor-pointer group select-none"
        id="wallet-address-btn"
      >
        {/* Wallet icon or logo */}
        {wallet?.adapter.icon ? (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="w-3.5 h-3.5 rounded-sm"
          />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        )}
        <span className="font-bold tracking-wider">{shortAddress}</span>
        <ChevronDown
          size={11}
          className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownOpen && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-52 bg-[#0E0E0E] border border-[#2A2A28] rounded-xl shadow-2xl z-50 overflow-hidden"
              id="wallet-dropdown"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#1C1C1A]">
                <div className="flex items-center gap-2">
                  {wallet?.adapter.icon && (
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      className="w-4 h-4 rounded-sm"
                    />
                  )}
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    {wallet?.adapter.name ?? "Wallet"}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#DEDBC8] font-bold mt-1 tracking-wider">
                  {shortAddress}
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] text-gray-400 hover:text-[#DEDBC8] hover:bg-white/5 transition-colors font-mono"
                  id="wallet-copy-btn"
                >
                  {copied ? (
                    <Check size={13} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied ? "Copied!" : "Copy Address"}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors font-mono"
                  id="wallet-disconnect-btn"
                >
                  <LogOut size={13} />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

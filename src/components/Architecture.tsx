/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check, ArrowRight } from "lucide-react";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";

interface ArchitectureProps {
  onLearnMore: (title: string) => void;
}

export function Architecture({ onLearnMore }: ArchitectureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const headingSegments = [
    { text: "Enterprise-grade protection for DeFi borrowers.", className: "text-[#E1E0CC] font-normal" },
  ];
  const headingSegmentsLine2 = [
    { text: "Built for Solana. Powered by Kamino & Derive.", className: "text-gray-500 font-normal" },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      className="relative min-h-screen bg-black py-20 sm:py-28 md:py-36 px-4 md:px-6 select-none overflow-hidden"
      id="architecture-section"
    >
      {/* Background subtle noise texture */}
      <div
        className="bg-noise absolute inset-0 opacity-[0.15] pointer-events-none"
        id="architecture-noise-texture"
      />

      <div className="w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16">

        {/* Header Block with segmented pulls-up */}
        <div className="flex flex-col items-center gap-2 max-w-3xl mx-auto text-center">
          <WordsPullUpMultiStyle
            segments={headingSegments}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-snug tracking-tight text-center"
          />
          <WordsPullUpMultiStyle
            segments={headingSegmentsLine2}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-snug tracking-tight text-center mt-1"
          />
        </div>

        {/* 4-Column Card Grid */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-2.5 lg:h-[480px] w-full"
          id="architecture-cards-container"
        >
          {/* CARD 1: Video Card */}
          <motion.div
            variants={cardVariants}
            className="relative lg:h-full min-h-[300px] rounded-xl sm:rounded-2xl overflow-hidden border border-[#232321] p-6 sm:p-8 flex flex-col justify-end group bg-black shadow-lg"
            id="arch-card-1"
          >
            {/* Embedded video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none select-none"
              id="card-1-bg-video"
            >
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4"
                type="video/mp4"
              />
            </video>
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            <div className="noise-overlay absolute inset-0 opacity-[0.5] mix-blend-overlay pointer-events-none" />

            {/* Bottom text */}
            <div className="relative z-10 flex flex-col gap-1">
              <span className="text-primary font-mono text-[10px] sm:text-xs tracking-widest uppercase">INTERACTIVE CORE</span>
              <h3 className="text-lg sm:text-xl font-medium tracking-tight text-[#E1E0CC]" id="card-1-title">
                The Self-Paying Hedge.
              </h3>
            </div>
          </motion.div>

          {/* CARD 2: Kamino Yield */}
          <motion.div
            variants={cardVariants}
            className="lg:h-full bg-[#1A1A18] rounded-xl sm:rounded-2xl border border-[#232321] p-6 sm:p-8 flex flex-col justify-between group shadow-lg"
            id="arch-card-2"
          >
            {/* Top icon and identifier */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85"
                  alt="Kamino Yield Icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#2A2A28] p-1 object-contain"
                  referrerPolicy="no-referrer"
                  id="card-2-icon"
                />
                <span className="text-[12px] font-mono font-medium text-gray-500 tracking-wider">01</span>
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-semibold text-[#E1E0CC] tracking-tight">Kamino Yield</h4>
                <p className="text-xs text-primary/70 font-mono mt-1">Capital Supply Route</p>
              </div>

              {/* Checklist items */}
              <ul className="space-y-3 pt-2 text-xs sm:text-[13px] font-sans">
                {[
                  "Auto-supply SOL",
                  "Earn 6%+ Base APY",
                  "Collateralize for USDC",
                  "Capital efficiency"
                ].map((item, index) => (
                  <li key={index} className="flex gap-2.5 items-start">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-400 leading-normal select-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learn more actions */}
            <button
              onClick={() => onLearnMore("Kamino Yield")}
              className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E1E0CC] hover:text-white transition-colors duration-200 cursor-pointer self-start group/btn"
              id="card-2-action-btn"
            >
              <span>Learn more</span>
              <ArrowRight
                size={14}
                className="transform -rotate-45 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              />
            </button>
          </motion.div>

          {/* CARD 3: Derive Options */}
          <motion.div
            variants={cardVariants}
            className="lg:h-full bg-[#1A1A18] rounded-xl sm:rounded-2xl border border-[#232321] p-6 sm:p-8 flex flex-col justify-between group shadow-lg"
            id="arch-card-3"
          >
            {/* Top icon and identifier */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85"
                  alt="Derive Options Icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#2A2A28] p-1 object-contain"
                  referrerPolicy="no-referrer"
                  id="card-3-icon"
                />
                <span className="text-[12px] font-mono font-medium text-gray-500 tracking-wider">02</span>
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-semibold text-[#E1E0CC] tracking-tight">Derive Options</h4>
                <p className="text-xs text-primary/70 font-mono mt-1">Hedge Derivatives Engine</p>
              </div>

              {/* Checklist items */}
              <ul className="space-y-3 pt-2 text-xs sm:text-[13px] font-sans">
                {[
                  "Deep OTM Put Options",
                  "Zero counterparty risk",
                  "Atomic execution"
                ].map((item, index) => (
                  <li key={index} className="flex gap-2.5 items-start">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-400 leading-normal select-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learn more actions */}
            <button
              onClick={() => onLearnMore("Derive Options")}
              className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E1E0CC] hover:text-white transition-colors duration-200 cursor-pointer self-start group/btn"
              id="card-3-action-btn"
            >
              <span>Learn more</span>
              <ArrowRight
                size={14}
                className="transform -rotate-45 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              />
            </button>
          </motion.div>

          {/* CARD 4: Smart Router */}
          <motion.div
            variants={cardVariants}
            className="lg:h-full bg-[#1A1A18] rounded-xl sm:rounded-2xl border border-[#232321] p-6 sm:p-8 flex flex-col justify-between group shadow-lg"
            id="arch-card-4"
          >
            {/* Top icon and identifier */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85"
                  alt="Smart Router Icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#2A2A28] p-1 object-contain"
                  referrerPolicy="no-referrer"
                  id="card-4-icon"
                />
                <span className="text-[12px] font-mono font-medium text-gray-500 tracking-wider">03</span>
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-semibold text-[#E1E0CC] tracking-tight">Smart Router</h4>
                <p className="text-xs text-primary/70 font-mono mt-1">Cross-Protocol Arbitrage</p>
              </div>

              {/* Checklist items */}
              <ul className="space-y-3 pt-2 text-xs sm:text-[13px] font-sans">
                {[
                  "One-click UX",
                  "Yield premium subsidy",
                  "Auto-exercise on crash"
                ].map((item, index) => (
                  <li key={index} className="flex gap-2.5 items-start">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-400 leading-normal select-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learn more actions */}
            <button
              onClick={() => onLearnMore("Smart Router")}
              className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E1E0CC] hover:text-white transition-colors duration-200 cursor-pointer self-start group/btn"
              id="card-4-action-btn"
            >
              <span>Learn more</span>
              <ArrowRight
                size={14}
                className="transform -rotate-45 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              />
            </button>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}

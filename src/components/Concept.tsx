/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";
import { AnimatedCharacterParagraph } from "./AnimatedCharacterParagraph";

export function Concept() {
  const headingSegments = [
    { text: "We build infrastructure,", className: "text-[#E1E0CC] font-normal" },
    { text: "not just interfaces.", className: "text-primary italic font-serif" },
    { text: "Automating your collateral protection through yield-driven hedges.", className: "text-[#E1E0CC] font-normal" },
  ];

  const bodyText = "By supplying SOL into Kamino, our smart contract generates a baseline yield that automatically subsidizes your Derive put option premium. Your position remains 100% protected against market crashes, while the insurance effectively pays for itself.";

  return (
    <section
      className="bg-black py-16 sm:py-24 md:py-32 px-4 md:px-6 flex flex-col items-center justify-center select-none"
      id="concept-section"
    >
      <div
        className="w-full max-w-6xl bg-[#101010] border border-[#232321] rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 md:p-20 text-center flex flex-col items-center gap-6 sm:gap-8 md:gap-10 shadow-2xl relative overflow-hidden"
        id="concept-inner-card"
      >
        {/* Top small label */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-primary text-[10px] sm:text-xs font-mono tracking-[0.2em] uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
            id="concept-label"
          >
            Infrastructure
          </span>
        </div>

        {/* Main Heading Segment */}
        <div className="max-w-4xl mx-auto">
          <WordsPullUpMultiStyle
            segments={headingSegments}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4.75rem] leading-[1.05] sm:leading-[1.0] tracking-tight text-center"
          />
        </div>

        {/* Subtle separator */}
        <div className="w-16 h-[1px] bg-[#2A2A28] my-2" />

        {/* Body Paragraph with scroll reveal character opacity */}
        <div className="max-w-3xl mx-auto px-2 sm:px-6">
          <AnimatedCharacterParagraph
            text={bodyText}
            className="text-[#DEDBC8] text-[13px] sm:text-sm md:text-base leading-relaxed text-center uppercase tracking-wide opacity-90 font-mono select-text"
          />
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      </div>
    </section>
  );
}

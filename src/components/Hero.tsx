/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { WordsPullUp } from "./WordsPullUp";
import { Navbar } from "./Navbar";

interface HeroProps {
  onProtectLoan: () => void;
  onScrollToSection: (id: string) => void;
}

export function Hero({ onProtectLoan, onScrollToSection }: HeroProps) {
  return (
    <section
      className="relative h-screen w-full bg-black p-4 md:p-6 select-none"
      id="hero-section"
    >
      {/* Outer block framed wrapper */}
      <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden border border-[#2A2A28] bg-black">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover select-none"
          id="hero-bg-video"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_084718_72a17915-4964-4059-afcd-22d59399b72e.mp4"
            type="video/mp4"
          />
        </video>

        {/* Noise overlay */}
        <div
          className="noise-overlay absolute inset-0 opacity-[0.7] mix-blend-overlay pointer-events-none"
          id="hero-noise-overlay"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"
          id="hero-gradient-overlay"
        />

        {/* Header Navbar positioned inside */}
        <Navbar onLaunchApp={onProtectLoan} onScrollToSection={onScrollToSection} />

        {/* Bottom content section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12 pb-12 sm:pb-16 md:pb-20 z-10">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            {/* Left Col: Giant header "Hedge" */}
            <div className="md:col-span-8 flex flex-col justify-end">
              <div className="relative inline-block w-fit">
                <WordsPullUp
                  text="Hedge"
                  className="text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] xl:text-[11vw] 2xl:text-[10vw] font-medium leading-[0.82] tracking-[-0.07em] uppercase"
                  showAsterisk={true}
                  delay={0.1}
                />
              </div>
            </div>

            {/* Right Col: Sub-text + Action Button */}
            <div className="md:col-span-4 flex flex-col items-start gap-6 sm:gap-8 pb-3 max-w-md md:max-w-none">
              {/* Animated sub-paragraph */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ color: "rgba(222, 219, 200, 0.85)" }}
                className="text-xs sm:text-sm md:text-base leading-[1.3] text-left opacity-90 select-text"
                id="hero-description"
              >
                A decentralized router that transforms idle Kamino yield into Derive put options, creating a self-paying liquidation shield for your Solana loans.
              </motion.p>

              {/* Action Circle Button */}
              <motion.button
                onClick={onProtectLoan}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group flex items-center gap-2 sm:gap-4 pl-5 sm:pl-6 pr-1.5 sm:pr-2 py-1.5 sm:py-2 bg-primary text-black font-semibold rounded-full hover:gap-3 sm:hover:gap-5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-primary/10 select-none"
                id="protect-loan-btn"
              >
                <span className="text-xs sm:text-sm uppercase tracking-wider font-bold">Protect Loan</span>
                <div
                  className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110"
                  id="protect-loan-arrow-container"
                >
                  <ArrowRight size={18} className="text-[#DEDBC8]" />
                </div>
              </motion.button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

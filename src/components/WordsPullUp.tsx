/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  delay?: number;
}

export function WordsPullUp({ text, className = "", showAsterisk = false, delay = 0 }: WordsPullUpProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });

  const words = text.split(/\s+/);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.span
      ref={containerRef}
      className={`inline-flex flex-wrap ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {words.map((word, index) => {
        const isLastWord = index === words.length - 1;

        if (isLastWord && showAsterisk) {
          return (
            <span key={index} className="inline-block mr-[0.25em] last:mr-0">
              <motion.span
                variants={wordVariants}
                className="relative inline-block"
              >
                {word}
                <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] select-none text-primary" id={`hero-asterisk-${index}`}>
                  *
                </span>
              </motion.span>
            </span>
          );
        }

        return (
          <span key={index} className="inline-block mr-[0.25em] last:mr-0 overflow-hidden">
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );
}

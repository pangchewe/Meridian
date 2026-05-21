/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { TextSegment } from "../types";

interface WordsPullUpMultiStyleProps {
  segments: TextSegment[];
  className?: string;
  delay?: number;
}

export function WordsPullUpMultiStyle({ segments, className = "", delay = 0 }: WordsPullUpMultiStyleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });

  // Flatten segments into an array of individual words each preserving its original className
  const wordsList: { word: string; customClass: string }[] = [];

  segments.forEach((seg) => {
    const words = seg.text.split(/(\s+)/); // Keep whitespace as separators if needed, or split by space
    words.forEach((w) => {
      if (w.trim().length > 0) {
        wordsList.push({
          word: w,
          customClass: seg.className || "",
        });
      }
    });
  });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
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
    <motion.div
      ref={containerRef}
      className={`inline-flex flex-wrap justify-center gap-x-[0.25em] gap-y-[0.1em] ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {wordsList.map((item, index) => (
        <span key={index} className="inline-block overflow-hidden">
          <motion.span
            variants={wordVariants}
            className={`inline-block ${item.customClass}`}
          >
            {item.word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

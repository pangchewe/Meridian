/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "motion/react";

interface AnimatedLetterProps {
  char: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
  key?: any;
}

export function AnimatedLetter({ char, progress, index, total }: AnimatedLetterProps) {
  const charProgress = index / total;
  // Staggering range [charProgress - 0.1, charProgress + 0.05]
  const start = Math.max(0, charProgress - 0.1);
  const end = Math.min(1, charProgress + 0.05);

  // Use a fallback in case start and end are identical (which can happen at the very beginning)
  const range = start === end ? [start, start + 0.001] : [start, end];
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className="inline-block select-none">
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

interface AnimatedCharacterParagraphProps {
  text: string;
  className?: string;
}

export function AnimatedCharacterParagraph({ text, className = "" }: AnimatedCharacterParagraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook scroll tracking to the container target with specific offset
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.83", "end 0.24"],
  });

  const chars = text.split("");
  const totalChars = chars.length;

  return (
    <div
      ref={containerRef}
      className={`inline-flex flex-wrap justify-center leading-relaxed tracking-wide text-center uppercase whitespace-normal ${className}`}
      id="scroll-bound-concept-paragraph"
    >
      {chars.map((char, index) => (
        <AnimatedLetter
          key={index}
          char={char}
          progress={scrollYProgress}
          index={index}
          total={totalChars}
        />
      ))}
    </div>
  );
}

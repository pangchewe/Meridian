/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface NavbarProps {
  onLaunchApp: () => void;
  onScrollToSection: (id: string) => void;
}

export function Navbar({ onLaunchApp, onScrollToSection }: NavbarProps) {
  const items = [
    { label: "How it works", target: "concept-section" },
    { label: "Kamino Yield", target: "architecture-section" },
    { label: "Derive Options", target: "architecture-section" },
    { label: "Security", target: "architecture-section" },
    { label: "Launch App", action: onLaunchApp },
  ];

  return (
    <nav
      className="absolute top-0 left-0 right-0 z-40 flex justify-center p-0"
      id="navbar-widget"
    >
      <div
        className="bg-black border-x border-b border-[#2A2A28] rounded-b-2xl md:rounded-b-3xl px-4 py-2.5 md:px-8 flex items-center justify-center shadow-lg"
        id="navbar-pill"
      >
        <ul className="flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14">
          {items.map((item, index) => {
            const isButton = !!item.action;

            if (isButton) {
              return (
                <li key={index}>
                  <button
                    onClick={item.action}
                    style={{ color: "rgba(225, 224, 204, 0.8)" }}
                    className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wide transition-colors hover:text-[#E1E0CC] cursor-pointer cursor-scale"
                    id={`nav-item-${index}`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            }

            return (
              <li key={index}>
                <button
                  onClick={() => onScrollToSection(item.target!)}
                  style={{ color: "rgba(225, 224, 204, 0.8)" }}
                  className="text-[10px] sm:text-xs md:text-sm font-normal tracking-wide transition-colors hover:text-[#E1E0CC] cursor-pointer cursor-scale"
                  id={`nav-item-${index}`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

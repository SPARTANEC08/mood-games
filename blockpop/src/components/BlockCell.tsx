import React from 'react';
import { CellColor } from '../types';

interface BlockCellProps {
  color?: CellColor | null;
  isEmpty?: boolean;
  isGhost?: boolean;
  isClearing?: boolean;
  className?: string;
}

// Crisp vibrant 3D colors matching Block Blast mobile hit
const COLOR_CONFIGS: Record<
  CellColor,
  {
    bg: string;
    borderTop: string;
    borderBottom: string;
    ghostBorder: string;
    shadow: string;
    center: string;
  }
> = {
  yellow: {
    bg: 'from-[#ffdd59] to-[#ffaa00]',
    borderTop: 'rgba(255, 255, 255, 0.75)',
    borderBottom: '#cc8800',
    ghostBorder: 'border-amber-400',
    shadow: 'shadow-[0_2px_6px_rgba(255,170,0,0.35)]',
    center: '#fff3b0',
  },
  orange: {
    bg: 'from-[#ff9f1a] to-[#e65100]',
    borderTop: 'rgba(255, 255, 255, 0.7)',
    borderBottom: '#b23c00',
    ghostBorder: 'border-orange-400',
    shadow: 'shadow-[0_2px_6px_rgba(230,81,0,0.35)]',
    center: '#ffd8be',
  },
  cyan: {
    bg: 'from-[#22d3ee] to-[#01a3a4]',
    borderTop: 'rgba(255, 255, 255, 0.75)',
    borderBottom: '#00797a',
    ghostBorder: 'border-cyan-400',
    shadow: 'shadow-[0_2px_6px_rgba(0,210,211,0.35)]',
    center: '#c8fcfd',
  },
  purple: {
    bg: 'from-[#c084fc] to-[#7c3aed]',
    borderTop: 'rgba(255, 255, 255, 0.7)',
    borderBottom: '#5b21b6',
    ghostBorder: 'border-purple-400',
    shadow: 'shadow-[0_2px_6px_rgba(124,58,237,0.35)]',
    center: '#edd8ff',
  },
  green: {
    bg: 'from-[#4ade80] to-[#10ac84]',
    borderTop: 'rgba(255, 255, 255, 0.75)',
    borderBottom: '#0b795c',
    ghostBorder: 'border-emerald-400',
    shadow: 'shadow-[0_2px_6px_rgba(16,172,132,0.35)]',
    center: '#d1fae5',
  },
  red: {
    bg: 'from-[#f87171] to-[#dc2626]',
    borderTop: 'rgba(255, 255, 255, 0.7)',
    borderBottom: '#991b1b',
    ghostBorder: 'border-rose-400',
    shadow: 'shadow-[0_2px_6px_rgba(220,38,38,0.35)]',
    center: '#fee2e2',
  },
  blue: {
    bg: 'from-[#60a5fa] to-[#1d4ed8]',
    borderTop: 'rgba(255, 255, 255, 0.75)',
    borderBottom: '#1e40af',
    ghostBorder: 'border-blue-400',
    shadow: 'shadow-[0_2px_6px_rgba(29,78,216,0.35)]',
    center: '#dbeafe',
  },
  magenta: {
    bg: 'from-[#f472b6] to-[#9333ea]',
    borderTop: 'rgba(255, 255, 255, 0.75)',
    borderBottom: '#6b21a8',
    ghostBorder: 'border-fuchsia-400',
    shadow: 'shadow-[0_2px_6px_rgba(147,51,234,0.35)]',
    center: '#fbcfe8',
  },
};

export const BlockCell: React.FC<BlockCellProps> = ({
  color,
  isEmpty = false,
  isGhost = false,
  isClearing = false,
  className = '',
}) => {
  // Empty socket on the board
  if (isEmpty || !color) {
    return (
      <div
        className={`w-full h-full rounded-[6px] sm:rounded-[8px] bg-[#11172f] border border-[#1b254a]/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${className}`}
      />
    );
  }

  const config = COLOR_CONFIGS[color] || COLOR_CONFIGS.yellow;

  // Ghost preview cell (shows exact placement on board)
  if (isGhost) {
    return (
      <div
        className={`w-full h-full rounded-[6px] sm:rounded-[8px] bg-gradient-to-br ${config.bg} opacity-55 border-2 ${config.ghostBorder} scale-[0.98] ${className}`}
      />
    );
  }

  // Cell in middle of blast animation
  if (isClearing) {
    return (
      <div
        className={`w-full h-full rounded-[6px] sm:rounded-[8px] bg-white brightness-125 scale-105 transition-all duration-150 ${className}`}
      />
    );
  }

  // Normal solid 3D Block Blast cell
  return (
    <div
      className={`relative w-full h-full rounded-[6px] sm:rounded-[8px] bg-gradient-to-b ${config.bg} ${config.shadow} overflow-hidden ${className}`}
      style={{
        borderTop: `1.5px solid ${config.borderTop}`,
        borderLeft: `1px solid ${config.borderTop}`,
        borderRight: `1px solid ${config.borderBottom}`,
        borderBottom: `2px solid ${config.borderBottom}`,
      }}
    >
      {/* Top glossy bevel */}
      <div className="absolute top-0 left-0 right-0 h-[38%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

      {/* Subtle center jewel shine */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full opacity-60 pointer-events-none"
        style={{
          backgroundColor: config.center,
        }}
      />
    </div>
  );
};

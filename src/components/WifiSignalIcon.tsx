/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WifiSignalIconProps {
  bars: 1 | 2 | 3;
  size?: number;
  className?: string;
  activeColor?: string; // Optional custom active color, defaults to standard green/yellow/red or theme green
}

export const WifiSignalIcon: React.FC<WifiSignalIconProps> = ({
  bars,
  size = 18,
  className = '',
  activeColor,
}) => {
  // Determine color based on bar level if not overridden
  const resolvedColor =
    activeColor ||
    (bars === 3 ? '#16a34a' : bars === 2 ? '#d97706' : '#dc2626');
  const inactiveColor = '#d1d5db'; // gray-300

  // 3 concentric curved arcs + base dot
  // Dot: Always active
  // Arc 1 (inner): Active for 2 and 3 bars
  // Arc 2 (outer): Active only for 3 bars
  const isDotActive = true;
  const isArc1Active = bars >= 2;
  const isArc2Active = bars >= 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block align-middle transition-colors ${className}`}
    >
      {/* Outer Arc (3rd bar) */}
      <path
        d="M2 8.5C6.5 4.5 17.5 4.5 22 8.5"
        stroke={isArc2Active ? resolvedColor : inactiveColor}
        strokeWidth="2.5"
      />

      {/* Middle Arc (2nd bar) */}
      <path
        d="M5 12.5C8.5 9.5 15.5 9.5 19 12.5"
        stroke={isArc1Active ? resolvedColor : inactiveColor}
        strokeWidth="2.5"
      />

      {/* Inner Arc (1st bar) */}
      <path
        d="M8.5 16.5C10.5 14.8 13.5 14.8 15.5 16.5"
        stroke={isDotActive ? resolvedColor : inactiveColor}
        strokeWidth="2.5"
      />

      {/* Center Dot */}
      <circle
        cx="12"
        cy="20"
        r="1.5"
        fill={resolvedColor}
        stroke="none"
      />
    </svg>
  );
};

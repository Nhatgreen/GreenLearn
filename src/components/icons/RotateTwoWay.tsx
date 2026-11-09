import React from 'react';

interface RotateTwoWayProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * Bi-directional rotation icon clearly indicating that the user can rotate left or right.
 */
export function RotateTwoWay({ className = "w-4 h-4", strokeWidth = 2.4 }: RotateTwoWayProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Horseshoe arc curving over the top with two opposing arrow heads */}
      <path d="M5 15a7.5 7.5 0 1 1 14 0" />
      <polyline points="2 12 5 15 8 13" />
      <polyline points="22 12 19 15 16 13" />
    </svg>
  );
}

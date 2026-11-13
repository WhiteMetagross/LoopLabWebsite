"use client";

import React from "react";

interface LoopLabLogoProps {
  className?: string;
  size?: number;
}

export default function LoopLabLogo({ className = "w-8 h-8", size = 32 }: LoopLabLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-full bg-white border border-slate-200 shadow-xs flex-shrink-0 ${className}`}
      aria-label="LoopLab Logo"
    >
      {/* Pure White Circular Background */}
      <circle cx="16" cy="16" r="15" fill="#FFFFFF" />

      {/* Upper Loop Arrow: Purple (#8b5cf6) */}
      <path
        d="M 8.5 15 A 7.5 7.5 0 0 1 23 14"
        stroke="#8B5CF6"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M 20 11.5 L 23.5 15.5 L 26.5 11.5"
        stroke="#8B5CF6"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Loop Arrow: Green (#10b981) */}
      <path
        d="M 23.5 17 A 7.5 7.5 0 0 1 9 18"
        stroke="#10B981"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M 12 20.5 L 8.5 16.5 L 5.5 20.5"
        stroke="#10B981"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


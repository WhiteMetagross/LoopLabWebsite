"use client";

import React from "react";
import Image from "next/image";

interface LoopLabLogoProps {
  className?: string;
  size?: number;
}

export default function LoopLabLogo({ className = "w-8 h-8", size = 32 }: LoopLabLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-white border border-slate-200 shadow-xs flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="LoopLab Logo"
    >
      <Image
        src="/looplab_logo.png"
        alt="LoopLab Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  src?: string;
  className?: string;
  size?: number;
  iconClassName?: string;
}

export function Logo({ src, className, size = 40, iconClassName }: LogoProps) {
  const [error, setError] = useState(false);

  // If no source is provided or we already hit an error, or if we use the default missing logo
  if (!src || error || src === '/logo.png') {
    return (
      <div className={cn("flex items-center justify-center bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl", className)}>
        <svg 
          viewBox="0 0 100 100" 
          width={size} 
          height={size} 
          className={cn("text-[#00a2ff]", iconClassName)}
        >
          <defs>
            <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#0072ff" />
            </linearGradient>
          </defs>
          
          <path 
            d="M30 75 L30 25 L55 50 L80 25 L80 75" 
            fill="none" 
            stroke="url(#logo-grad)" 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            filter="url(#logo-glow)"
          />
          
          <path d="M30 45 V65" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <circle cx="30" cy="68" r="4" fill="#00e5ff" filter="url(#logo-glow)" />
          
          <path d="M42 58 V78" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <circle cx="42" cy="81" r="4" fill="#00e5ff" filter="url(#logo-glow)" />
          
          <path d="M52 68 V88" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <circle cx="52" cy="91" r="4" fill="#00e5ff" filter="url(#logo-glow)" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt="Business Logo"
        fill
        className="object-contain"
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
        unoptimized={src.startsWith('data:')}
      />
    </div>
  );
}

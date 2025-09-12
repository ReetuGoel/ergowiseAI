import React from 'react';

export function ErgoWiseLogo({ size = 48 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      style={{ marginRight: 12 }}
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="lightOrangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      
      {/* Background rounded square */}
      <rect x="8" y="8" rx="14" ry="14" width="84" height="64" fill="url(#lightOrangeGradient)" stroke="url(#orangeGradient)" strokeWidth="2" />

      {/* Monitor body */}
      <g transform="translate(0,0)">
        <rect x="18" y="18" width="64" height="36" rx="6" ry="6" fill="url(#orangeGradient)" />
        {/* Screen inner */}
        <rect x="24" y="24" width="52" height="24" rx="4" ry="4" fill="#fff" />

        {/* Stand */}
        <rect x="44" y="56" width="12" height="8" rx="2" ry="2" fill="url(#orangeGradient)" />
        <rect x="38" y="64" width="24" height="4" rx="2" ry="2" fill="url(#lightOrangeGradient)" />

        {/* Checkmark on screen */}
        <path d="M34 36 L44 46 L62 30" stroke="#ea580c" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
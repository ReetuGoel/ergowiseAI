import React from 'react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  rounded?: number;
}

// ErgoWise logo with modern brain + spine design
export function ErgoWiseLogo({ size = 48, showWordmark = false, tagline = 'POSTURE. AI. WELLNESS' }: LogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: showWordmark ? 12 : 0 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* New ErgoWise Logo SVG */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 200 200" 
          style={{ 
            flexShrink: 0,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
          }}
        >
          {/* Background gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
            <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd89b" />
              <stop offset="100%" stopColor="#19547b" />
            </linearGradient>
            <linearGradient id="spineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#43e97b" />
            </linearGradient>
          </defs>
          
          {/* Brain outline with neural network pattern */}
          <path 
            d="M100 30 C130 30, 150 50, 150 80 C150 90, 145 100, 140 108 C135 115, 125 120, 115 118 C105 116, 95 110, 90 100 C85 110, 75 116, 65 118 C55 120, 45 115, 40 108 C35 100, 30 90, 30 80 C30 50, 50 30, 80 30 Z" 
            fill="url(#brainGradient)" 
            opacity="0.9"
          />
          
          {/* Neural network lines inside brain */}
          <g stroke="#fff" strokeWidth="1" opacity="0.6" fill="none">
            <path d="M60 60 L80 70 L100 65 L120 75 L140 70" />
            <path d="M70 80 L90 85 L110 80 L130 85" />
            <path d="M65 95 L85 100 L105 95 L125 100" />
          </g>
          
          {/* AI symbol in brain */}
          <text x="100" y="85" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold" opacity="0.8">A</text>
          
          {/* Spine/vertebrae */}
          <g fill="url(#spineGradient)">
            <rect x="92" y="110" width="16" height="8" rx="2" />
            <rect x="90" y="120" width="20" height="8" rx="2" />
            <rect x="88" y="130" width="24" height="8" rx="2" />
            <rect x="90" y="140" width="20" height="8" rx="2" />
            <rect x="92" y="150" width="16" height="8" rx="2" />
            <rect x="94" y="160" width="12" height="8" rx="2" />
          </g>
          
          {/* Radiating light rays */}
          <g stroke="url(#bgGradient)" strokeWidth="2" opacity="0.4">
            <line x1="100" y1="20" x2="100" y2="10" />
            <line x1="130" y1="30" x2="140" y2="20" />
            <line x1="150" y1="60" x2="160" y2="50" />
            <line x1="155" y1="90" x2="165" y2="90" />
            <line x1="70" y1="30" x2="60" y2="20" />
            <line x1="50" y1="60" x2="40" y2="50" />
            <line x1="45" y1="90" x2="35" y2="90" />
          </g>
        </svg>
      </div>
      
      {showWordmark && (
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ 
            fontSize: Math.round(size * 0.5), 
            fontWeight: 700, 
            letterSpacing: '-0.8px', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ErgoWise
          </div>
          {tagline && (
            <div style={{ 
              fontSize: Math.round(size * 0.18), 
              color: '#666', 
              opacity: 0.9,
              letterSpacing: '1px',
              fontWeight: 500
            }}>
              {tagline}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
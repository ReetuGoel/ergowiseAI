import React from 'react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  rounded?: number;
}

// ErgoWise logo using the PNG image
export function ErgoWiseLogo({ size = 48, showWordmark = false, tagline = 'Ergonomic Assessment App' }: LogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: showWordmark ? 12 : 0 }}>
      <img
        src="/ewlogo.png"
        alt="ErgoWise Logo"
        width={size}
        height={size}
        style={{ 
          flexShrink: 0,
          objectFit: 'contain'
        }}
      />
      {showWordmark && (
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontSize: Math.round(size * 0.42), fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>
            <span style={{ color: 'var(--color-primary)' }}>Ergo</span><span style={{ color: 'var(--color-text-soft)' }}>Wise</span>
          </div>
          {tagline && (
            <div style={{ fontSize: Math.round(size * 0.17), color: 'var(--color-text-soft)', opacity: 0.85 }}>
              {tagline}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React from 'react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  rounded?: number;
}

// ErgoWise logo using the beautiful brain + spine design image
export function ErgoWiseLogo({ size = 48, showWordmark = false, tagline = 'POSTURE. AI. WELLNESS' }: LogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: showWordmark ? 12 : 0 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Use the new ErgoWise logo image */}
        <img
          src={`${process.env.PUBLIC_URL}/ewnewlogo.png`}
          alt="ErgoWise - AI-Powered Posture Analysis"
          width={size}
          height={size}
          onError={(e) => {
            console.error('Logo failed to load:', e);
            // Fallback to old logo if new one fails
            (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/ewlogo.png`;
          }}
          onLoad={() => console.log('Logo loaded successfully')}
          style={{ 
            flexShrink: 0,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
            borderRadius: '8px'
          }}
        />
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
            backgroundClip: 'text',
            color: '#333' // Fallback for browsers that don't support background-clip
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
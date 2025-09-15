import { memo } from 'react'

/**
 * Brand Logo component.
 * Combines an abstract ergonomic chair & monitor glyph with gradient text.
 */
export const Logo = memo(function Logo({ withText = true, size = 40 }: { withText?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="ergowiseGradient" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="oklch(0.86 0.11 70)" />
            <stop offset="55%" stopColor="oklch(0.74 0.17 70)" />
            <stop offset="100%" stopColor="oklch(0.58 0.18 70)" />
          </linearGradient>
        </defs>
        <rect x="8" y="14" width="48" height="30" rx="6" stroke="url(#ergowiseGradient)" strokeWidth="4" />
        <rect x="16" y="22" width="32" height="14" rx="3" fill="url(#ergowiseGradient)" opacity="0.15" />
        <path
          d="M28 48h8l1.8 6c.2.7-.3 1.4-1 1.4h-9.6c-.7 0-1.2-.7-1-1.4L28 48Z"
          stroke="url(#ergowiseGradient)"
          strokeWidth="4"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="44" cy="18" r="4" fill="url(#ergowiseGradient)" />
      </svg>
      {withText && (
        <div className="leading-tight">
          <div className="text-lg font-medium tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--brand-orange-400),var(--brand-orange-700))]">
            ErgoWise
          </div>
          <div className="text-[11px] font-medium text-muted-foreground -mt-0.5">
            Workspace Wellness
          </div>
        </div>
      )}
    </div>
  )
})

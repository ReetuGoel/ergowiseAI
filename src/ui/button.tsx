import React from "react";

export function Button({
  children,
  style,
  className,
  variant = 'filled',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  style?: React.CSSProperties;
  className?: string;
  variant?: 'filled' | 'outline';
}) {
  const base: React.CSSProperties = {
    background: variant === 'filled' ? 'var(--color-primary)' : 'transparent',
    color: variant === 'filled' ? '#fff' : 'var(--color-primary)',
    border: variant === 'filled' ? 'none' : '1px solid var(--color-primary)',
    borderRadius: '8px',
    padding: '0.55rem 1.25rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 6px rgba(251,146,60,0.25)',
    transition: 'background .2s, color .2s, transform .15s'
  };
  return (
    <button
      className={className}
      style={{ ...base, ...style }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      {...props}
    >
      {children}
    </button>
  );
}

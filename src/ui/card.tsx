import React from "react";

export function Card({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--color-surface, var(--color-background))',
        border: '1px solid var(--color-surface-alt2, var(--color-primary))',
        borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(251,146,60,0.15)',
        padding: '1.25rem 1.5rem',
        margin: '0.75rem 0',
        transition: 'box-shadow .2s, transform .2s',
        ...style,
      }}
      onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(251,146,60,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,146,60,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </div>
  );
}

import React from 'react';

export function Badge({ children, className = '', variant = 'default' }: React.PropsWithChildren<{ className?: string; variant?: string }>) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}
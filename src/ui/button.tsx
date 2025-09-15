import React from 'react';

export function Button({ children, onClick, variant = 'default', className = '' }: React.PropsWithChildren<{ onClick?: () => void; variant?: string; className?: string }>) {
  const base = 'px-4 py-2 rounded font-medium transition-colors';
  const outline = variant === 'outline' ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700';
  return (
    <button onClick={onClick} className={`${base} ${outline} ${className}`}>
      {children}
    </button>
  );
}
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
        background: "var(--color-background)",
        border: "1px solid var(--color-primary)",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
        padding: "1.5rem",
        margin: "1rem 0",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

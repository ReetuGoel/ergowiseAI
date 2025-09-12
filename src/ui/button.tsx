import React from "react";

export function Button({
  children,
  style,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <button
      className={className}
      style={{
        background: "var(--color-primary)",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "0.5rem 1.2rem",
        cursor: "pointer",
        fontWeight: 500,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

import React from "react";

export function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: "outline" | "filled";
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        background:
          variant === "outline"
            ? "transparent"
            : "var(--color-primary)",
        color: variant === "outline" ? "var(--color-primary)" : "#fff",
        borderRadius: "12px",
        padding: "0.3em 1em",
        fontWeight: 500,
        fontSize: "0.75rem",
        letterSpacing: "0.03em",
        boxShadow:
          variant === "outline"
            ? "0 1px 4px rgba(251,146,60,0.25)"
            : "0 1px 4px rgba(0,0,0,0.08)",
        border:
          variant === "outline"
            ? "1px solid var(--color-primary)"
            : "none",
        textTransform: 'uppercase'
      }}
    >
      {children}
    </span>
  );
}

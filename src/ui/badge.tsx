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
        fontSize: "0.95em",
        letterSpacing: "0.03em",
        boxShadow:
          variant === "outline"
            ? "0 1px 4px rgba(25, 118, 210, 0.12)"
            : "none",
        border:
          variant === "outline"
            ? "1px solid var(--color-primary)"
            : "none",
      }}
    >
      {children}
    </span>
  );
}

// Usage example
// <Badge className={getPriorityColor(rec.priority)}>{rec.priority} priority</Badge>

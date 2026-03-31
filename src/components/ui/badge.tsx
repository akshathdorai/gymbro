"use client";

import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "muted" | "info";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-[var(--color-primary-muted)] text-[var(--color-primary)]": variant === "default",
          "bg-[var(--color-success-muted)] text-[var(--color-success)]": variant === "success",
          "bg-[var(--color-warning-muted)] text-[var(--color-warning)]": variant === "warning",
          "bg-[var(--color-danger-muted)] text-[var(--color-danger)]": variant === "danger",
          "bg-[var(--color-border)] text-[var(--color-muted-foreground)]": variant === "muted",
          "bg-[var(--color-info-muted)] text-[var(--color-info)]": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}

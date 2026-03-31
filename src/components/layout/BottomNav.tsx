"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, UtensilsCrossed, MessageCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/meals", icon: UtensilsCrossed, label: "Meals" },
  { href: "/chat", icon: MessageCircle, label: "Coach" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0",
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)] active:text-[var(--color-foreground)]"
              )}
            >
              <Icon
                className={cn("w-5 h-5", active && "stroke-[2.5]")}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className={cn("text-[10px] leading-none", active ? "font-semibold" : "font-normal")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

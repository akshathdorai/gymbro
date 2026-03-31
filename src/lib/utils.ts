import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = "MMM d, yyyy") {
  return format(new Date(date), fmt);
}

export function relativeTime(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, "h:mm a")}`;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatWeight(kg: number, unit: "kg" | "lbs" = "kg") {
  if (unit === "lbs") return `${(kg * 2.20462).toFixed(1)} lbs`;
  return `${kg.toFixed(1)} kg`;
}

export function mlToLitres(ml: number) {
  return (ml / 1000).toFixed(1);
}

/** Epley formula: 1RM estimate from weight × reps */
export function calculateE1RM(weightKg: number, reps: number) {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function weekNumber(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function progressPct(current: number, target: number) {
  if (target <= 0) return 0;
  return clamp(Math.round((current / target) * 100), 0, 100);
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Returns a colour string based on progress percentage */
export function progressColor(pct: number): string {
  if (pct >= 100) return "var(--color-success)";
  if (pct >= 66) return "var(--color-primary)";
  if (pct >= 33) return "var(--color-warning)";
  return "var(--color-danger)";
}

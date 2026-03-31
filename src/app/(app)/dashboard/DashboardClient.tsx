"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Footprints, Droplets, Moon, Flame, Dumbbell, Zap,
  ChevronRight, Plus, MessageCircle, CheckCircle2, Circle, Settings
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RingProgress, ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { progressPct, mlToLitres, cn } from "@/lib/utils";
import type { UserTargets, DailyLog } from "@/types/database.types";

interface DashboardClientProps {
  userName: string;
  targets: UserTargets | null;
  log: DailyLog | null;
  mealTotals: { calories: number; protein: number; carbs: number; fat: number };
  workoutToday: { id: string; name: string | null; completed_at: string } | null;
  weights: { weight_kg: number; logged_at: string }[];
  program: { structure: unknown; phase_number: number; week_number: number; name: string | null } | null;
  today: string;
}

export function DashboardClient({
  userName,
  targets,
  log,
  mealTotals,
  workoutToday,
  weights,
  program,
  today,
}: DashboardClientProps) {
  const router = useRouter();
  const [waterLoading, setWaterLoading] = useState(false);
  const [currentLog, setCurrentLog] = useState(log);

  const t = targets;
  const calorieTarget = t?.calorie_target || 1800;
  const proteinTarget = t?.protein_target_g || 135;
  const stepTarget = t?.step_target || 8000;
  const waterTarget = t?.water_ml_target || 2500;
  const sleepTarget = t?.sleep_hours_target || 7.5;

  const steps = currentLog?.steps || 0;
  const waterMl = currentLog?.water_ml || 0;
  const sleep = currentLog?.sleep_hours || 0;
  const stretchDone = currentLog?.stretching_done || false;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Morning" : greetingHour < 17 ? "Afternoon" : "Evening";

  const currentWeight = weights[0]?.weight_kg;

  async function addWater(ml: number) {
    setWaterLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newWater = waterMl + ml;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("upsert_daily_log", {
      p_user_id: user.id,
      p_date: today,
      p_water_ml: newWater,
    });

    setCurrentLog((prev) => prev ? { ...prev, water_ml: newWater } : { id: "", user_id: user.id, log_date: today, steps: 0, water_ml: newWater, sleep_hours: null, stretching_done: false, notes: null, created_at: "", updated_at: "" });
    setWaterLoading(false);
  }

  const todayStructure = program?.structure as {
    days: Array<{ day_key: string; name: string }>;
    schedule: string[];
  } | null;

  // Determine today's scheduled workout
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
  const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const scheduledDayKey = todayStructure?.schedule?.[scheduleIndex];
  const scheduledWorkout = scheduledDayKey && scheduledDayKey !== "rest"
    ? todayStructure?.days?.find((d) => d.day_key === scheduledDayKey)
    : null;

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted)]">{format(new Date(), "EEEE, MMM d")}</p>
          <h1 className="text-xl font-bold">
            {greeting}, {userName || "champ"}
          </h1>
        </div>
        {currentWeight && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold">{currentWeight}<span className="text-sm font-normal text-[var(--color-muted)]">kg</span></p>
              <Link href="/progress" className="text-xs text-[var(--color-primary)]">Log weight</Link>
            </div>
            <Link href="/settings" className="text-[var(--color-muted)]">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        )}
        {!currentWeight && (
          <Link href="/settings" className="text-[var(--color-muted)]">
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Macro rings */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Today&apos;s Nutrition</span>
            <Link href="/meals" className="text-xs text-[var(--color-primary)] flex items-center gap-0.5">
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Cal", value: mealTotals.calories, target: calorieTarget, color: "var(--color-calories)", unit: "" },
              { label: "Protein", value: Math.round(mealTotals.protein), target: proteinTarget, color: "var(--color-protein)", unit: "g" },
              { label: "Carbs", value: Math.round(mealTotals.carbs), target: t?.carb_target_g || 180, color: "var(--color-carbs)", unit: "g" },
              { label: "Fat", value: Math.round(mealTotals.fat), target: t?.fat_target_g || 55, color: "var(--color-fat)", unit: "g" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <RingProgress value={m.value} max={m.target} size={64} strokeWidth={5} color={m.color}>
                  <div className="text-center">
                    <p className="text-[10px] font-bold leading-none">{m.value}</p>
                  </div>
                </RingProgress>
                <p className="text-[11px] text-[var(--color-muted)]">{m.label}</p>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">{m.target}{m.unit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps + Water + Sleep row */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          icon={<Footprints className="w-4 h-4" />}
          label="Steps"
          value={steps.toLocaleString()}
          target={stepTarget.toLocaleString()}
          pct={progressPct(steps, stepTarget)}
          color="var(--color-steps)"
          href="/dashboard"
        />
        <MetricCard
          icon={<Droplets className="w-4 h-4" />}
          label="Water"
          value={`${mlToLitres(waterMl)}L`}
          target={`${mlToLitres(waterTarget)}L`}
          pct={progressPct(waterMl, waterTarget)}
          color="var(--color-water)"
          href="/dashboard"
        />
        <MetricCard
          icon={<Moon className="w-4 h-4" />}
          label="Sleep"
          value={sleep ? `${sleep}h` : "—"}
          target={`${sleepTarget}h`}
          pct={progressPct(sleep, sleepTarget)}
          color="var(--color-sleep)"
          href="/dashboard"
        />
      </div>

      {/* Quick add water */}
      <Card elevated>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[var(--color-water)]" />
              <span className="text-sm font-medium">{mlToLitres(waterMl)}L / {mlToLitres(waterTarget)}L</span>
            </div>
            <div className="flex gap-1.5">
              {[250, 500, 750].map((ml) => (
                <button
                  key={ml}
                  onClick={() => addWater(ml)}
                  disabled={waterLoading}
                  className="text-xs px-2 py-1 rounded-md bg-[var(--color-info-muted)] text-[var(--color-info)] active:scale-95 transition-transform"
                >
                  +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                </button>
              ))}
            </div>
          </div>
          <ProgressBar value={waterMl} max={waterTarget} color="var(--color-water)" className="mt-2" />
        </CardContent>
      </Card>

      {/* Workout status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm font-medium">
                  {workoutToday ? workoutToday.name || "Workout" : scheduledWorkout ? scheduledWorkout.name : "Rest Day"}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Phase {program?.phase_number || 1} · Week {program?.week_number || 1}
                </p>
              </div>
            </div>
            {workoutToday ? (
              <Badge variant="success">Done</Badge>
            ) : scheduledWorkout ? (
              <Link href="/workout">
                <Button size="sm">Start</Button>
              </Link>
            ) : (
              <Badge variant="muted">Rest</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stretching */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stretchDone ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
              ) : (
                <Circle className="w-5 h-5 text-[var(--color-muted)]" />
              )}
              <span className="text-sm">Daily stretching</span>
              {stretchDone && <Badge variant="success">Done</Badge>}
            </div>
            {!stretchDone && (
              <Link href="/workout" className="text-xs text-[var(--color-primary)]">
                Start
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/meals/log">
          <Button variant="outline" className="w-full gap-2 h-11">
            <Plus className="w-4 h-4" />
            Log Meal
          </Button>
        </Link>
        <Link href="/chat">
          <Button variant="outline" className="w-full gap-2 h-11">
            <MessageCircle className="w-4 h-4" />
            Ask Coach
          </Button>
        </Link>
      </div>

      {/* Coach CTA if protein is low */}
      {mealTotals.protein < proteinTarget * 0.5 && mealTotals.calories > 0 && (
        <Card className="border-[var(--color-warning)] bg-[var(--color-warning-muted)]">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
              <p className="text-xs text-[var(--color-warning)]">
                Protein is at {Math.round(mealTotals.protein)}g. You need {proteinTarget}g. Prioritize a protein source at your next meal.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon, label, value, target, pct, color, href
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  target: string;
  pct: number;
  color: string;
  href: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 mb-2 text-[var(--color-muted)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold leading-none mb-1" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[var(--color-muted)] mb-2">/{target}</p>
      <ProgressBar value={pct} max={100} color={color} />
    </Card>
  );
}

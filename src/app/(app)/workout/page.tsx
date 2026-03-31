import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Dumbbell, ChevronRight, History, Play, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { todayISO } from "@/lib/utils";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const [programRes, recentWorkoutsRes, todayWorkoutRes] = await Promise.all([
    supabase.from("program").select("*").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
    supabase.from("workouts").select("id, name, workout_date, duration_sec").eq("user_id", user.id).order("workout_date", { ascending: false }).limit(6),
    supabase.from("workouts").select("id, name").eq("user_id", user.id).eq("workout_date", today).maybeSingle(),
  ]);

  const program = programRes.data;
  const structure = program?.structure as {
    days: Array<{ day_key: string; name: string; exercises: Array<{ name: string; sets: number; reps: string; target_weight_kg: number }> }>;
    schedule: string[];
    daily_stretches?: Array<{ name: string; duration_sec: number }>;
  } | null;

  const dayOfWeek = new Date().getDay();
  const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const scheduledDayKey = structure?.schedule?.[scheduleIndex];
  const scheduledWorkout = scheduledDayKey && scheduledDayKey !== "rest"
    ? structure?.days?.find((d) => d.day_key === scheduledDayKey)
    : null;

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout</h1>
        <Link href="/workout/history">
          <Button variant="ghost" size="sm" className="gap-1">
            <History className="w-4 h-4" />
            History
          </Button>
        </Link>
      </div>

      {/* Today's workout */}
      {todayWorkoutRes.data ? (
        <Card className="border-[var(--color-success)] bg-[var(--color-success-muted)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
              <div>
                <p className="font-semibold text-[var(--color-success)]">{todayWorkoutRes.data.name} — Done</p>
                <p className="text-xs text-[var(--color-muted)]">Completed today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : scheduledWorkout ? (
        <Card className="border-[var(--color-primary)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="default" className="mb-1">Scheduled today</Badge>
                <p className="font-semibold">{scheduledWorkout.name}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {scheduledWorkout.exercises.length} exercises
                </p>
              </div>
              <Link href={`/workout/active?day=${scheduledWorkout.day_key}`}>
                <Button className="gap-2">
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <p className="text-center text-[var(--color-muted)] py-2">Rest day — recover well.</p>
          </CardContent>
        </Card>
      )}

      {/* Program workouts */}
      {structure?.days && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
            Phase {program?.phase_number} · Week {program?.week_number} · Your Program
          </h2>
          {structure.days.map((day) => (
            <Card key={day.day_key} elevated>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center">
                      <span className="text-sm font-bold text-[var(--color-primary)]">{day.day_key}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{day.name.split("—")[0].trim()}</p>
                      <p className="text-xs text-[var(--color-muted)]">{day.exercises.length} exercises</p>
                    </div>
                  </div>
                  <Link href={`/workout/active?day=${day.day_key}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                {/* Exercise preview */}
                <div className="mt-2 space-y-1">
                  {day.exercises.slice(0, 3).map((ex) => (
                    <div key={ex.name} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-muted-foreground)]">{ex.name}</span>
                      <span className="text-[var(--color-muted)]">
                        {ex.sets}×{ex.reps} · {ex.target_weight_kg}kg
                      </span>
                    </div>
                  ))}
                  {day.exercises.length > 3 && (
                    <p className="text-xs text-[var(--color-muted)]">+{day.exercises.length - 3} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Daily stretches */}
      {structure?.daily_stretches && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Daily Stretching</h2>
          {structure.daily_stretches.map((s) => (
            <Card key={s.name} elevated>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">{s.name}</p>
                  <span className="text-xs text-[var(--color-muted)]">{s.duration_sec}s</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent workouts */}
      {recentWorkoutsRes.data && recentWorkoutsRes.data.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Recent</h2>
          {recentWorkoutsRes.data.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0">
              <div>
                <p className="text-sm">{w.name || "Workout"}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {format(new Date(w.workout_date), "EEE, MMM d")}
                </p>
              </div>
              {w.duration_sec && (
                <span className="text-xs text-[var(--color-muted)]">
                  {Math.round(w.duration_sec / 60)}min
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

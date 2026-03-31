import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateE1RM } from "@/lib/utils";

export default async function WorkoutHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [workoutsRes, setsRes] = await Promise.all([
    supabase.from("workouts").select("id, name, workout_date, duration_sec, notes").eq("user_id", user.id).order("workout_date", { ascending: false }).limit(20),
    supabase.from("workout_sets").select("exercise, weight_kg, reps, set_number, workout_id, created_at").eq("user_id", user.id).eq("completed", true).order("created_at", { ascending: false }).limit(200),
  ]);

  const workouts = workoutsRes.data || [];
  const sets = setsRes.data || [];

  // Group sets by exercise for progression tracking
  const exerciseProgress: Record<string, Array<{ date: string; e1rm: number; weight: number; reps: number }>> = {};
  sets.forEach((s) => {
    if (!s.weight_kg || !s.reps) return;
    const workout = workouts.find((w) => w.id === s.workout_id);
    if (!workout) return;
    const e1rm = calculateE1RM(s.weight_kg, s.reps);
    if (!exerciseProgress[s.exercise]) exerciseProgress[s.exercise] = [];
    exerciseProgress[s.exercise].push({
      date: workout.workout_date,
      e1rm: Math.round(e1rm * 10) / 10,
      weight: s.weight_kg,
      reps: s.reps,
    });
  });

  // Top exercises by volume
  const topExercises = Object.entries(exerciseProgress)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/workout" className="text-[var(--color-muted)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Workout History</h1>
      </div>

      {/* Progression per exercise */}
      {topExercises.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Progression</h2>
          {topExercises.map(([exerciseName, data]) => {
            const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
            const latest = sorted[sorted.length - 1];
            const first = sorted[0];
            const improvement = latest && first ? latest.e1rm - first.e1rm : 0;

            return (
              <Card key={exerciseName} elevated>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{exerciseName}</p>
                    {improvement > 0 && (
                      <span className="text-xs text-[var(--color-success)]">+{improvement.toFixed(1)}kg e1RM</span>
                    )}
                  </div>
                  {latest && (
                    <p className="text-xs text-[var(--color-muted)]">
                      Latest: {latest.weight}kg × {latest.reps} reps · e1RM {latest.e1rm}kg
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Session history */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Sessions</h2>
        {workouts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-8">No workouts logged yet.</p>
        ) : (
          workouts.map((w) => {
            const workoutSets = sets.filter((s) => s.workout_id === w.id);
            const uniqueExercises = [...new Set(workoutSets.map((s) => s.exercise))];

            return (
              <Card key={w.id} elevated>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{w.name || "Workout"}</p>
                    <span className="text-xs text-[var(--color-muted)]">
                      {format(new Date(w.workout_date), "EEE, MMM d")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                    {w.duration_sec && <span>{Math.round(w.duration_sec / 60)} min</span>}
                    <span>{workoutSets.length} sets</span>
                    <span>{uniqueExercises.length} exercises</span>
                  </div>
                  {uniqueExercises.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uniqueExercises.slice(0, 3).map((ex) => {
                        const exSets = workoutSets.filter((s) => s.exercise === ex);
                        const bestSet = exSets.reduce((best, s) =>
                          (s.weight_kg || 0) > (best.weight_kg || 0) ? s : best, exSets[0]);
                        return (
                          <div key={ex} className="flex justify-between text-xs">
                            <span className="text-[var(--color-muted-foreground)]">{ex}</span>
                            {bestSet?.weight_kg && (
                              <span className="text-[var(--color-muted)]">{bestSet.weight_kg}kg × {bestSet.reps}</span>
                            )}
                          </div>
                        );
                      })}
                      {uniqueExercises.length > 3 && (
                        <p className="text-xs text-[var(--color-muted)]">+{uniqueExercises.length - 3} more</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

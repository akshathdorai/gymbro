"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, ChevronUp, Check, Timer, X, ExternalLink,
  ChevronLeft, Play, Pause, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDuration, todayISO } from "@/lib/utils";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  target_weight_kg: number;
  rest_sec: number;
  form_cues?: string;
  video_url?: string;
  is_timed?: boolean;
}

interface SetData {
  weight_kg: number;
  reps: number;
  duration_sec?: number;
  completed: boolean;
}

interface ActiveWorkoutClientProps {
  userId: string;
  dayKey: string;
  workout: { day_key: string; name: string; exercises: Exercise[] };
  stretches?: Array<{ name: string; duration_sec: number; notes?: string }>;
  phaseNumber: number;
  weekNumber: number;
}

export function ActiveWorkoutClient({
  userId, dayKey, workout, stretches, phaseNumber, weekNumber
}: ActiveWorkoutClientProps) {
  const router = useRouter();
  const [sets, setSets] = useState<Record<string, SetData[]>>(() => {
    const initial: Record<string, SetData[]> = {};
    workout.exercises.forEach((ex) => {
      initial[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight_kg: ex.target_weight_kg,
        reps: parseInt(ex.reps) || 10,
        duration_sec: ex.is_timed ? 30 : undefined,
        completed: false,
      }));
    });
    return initial;
  });

  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number; max: number }>({ active: false, seconds: 0, max: 60 });
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [stretchDone, setStretchDone] = useState<Record<string, boolean>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(new Date());

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Rest timer
  useEffect(() => {
    if (!restTimer.active) {
      if (restRef.current) clearInterval(restRef.current);
      return;
    }
    restRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.seconds <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          // Vibrate when done
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
          return { ...prev, active: false, seconds: 0 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restTimer.active]);

  function toggleSet(exerciseName: string, setIndex: number, restSec: number) {
    setSets((prev) => {
      const exerciseSets = [...prev[exerciseName]];
      const currentSet = exerciseSets[setIndex];
      const nowCompleted = !currentSet.completed;
      exerciseSets[setIndex] = { ...currentSet, completed: nowCompleted };

      if (nowCompleted) {
        setRestTimer({ active: true, seconds: restSec, max: restSec });
      }

      return { ...prev, [exerciseName]: exerciseSets };
    });
  }

  function updateSet(exerciseName: string, setIndex: number, field: "weight_kg" | "reps" | "duration_sec", value: number) {
    setSets((prev) => {
      const exerciseSets = [...prev[exerciseName]];
      exerciseSets[setIndex] = { ...exerciseSets[setIndex], [field]: value };
      return { ...prev, [exerciseName]: exerciseSets };
    });
  }

  function dismissRestTimer() {
    if (restRef.current) clearInterval(restRef.current);
    setRestTimer({ active: false, seconds: 0, max: 60 });
  }

  const completedSetsCount = Object.values(sets).flat().filter((s) => s.completed).length;
  const totalSetsCount = Object.values(sets).flat().length;
  const allDone = completedSetsCount === totalSetsCount;

  async function finishWorkout() {
    setSaving(true);
    const supabase = createClient();
    const today = todayISO();

    // Insert workout record
    const { data: workoutRecord, error } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        workout_date: today,
        name: workout.name,
        duration_sec: elapsed,
        notes: `Phase ${phaseNumber} Week ${weekNumber}`,
      })
      .select("id")
      .single();

    if (error || !workoutRecord) {
      setSaving(false);
      alert("Failed to save workout");
      return;
    }

    // Insert all sets
    const setsToInsert = workout.exercises.flatMap((ex) =>
      sets[ex.name]
        .filter((s) => s.completed)
        .map((s, i) => ({
          workout_id: workoutRecord.id,
          user_id: userId,
          exercise: ex.name,
          set_number: i + 1,
          weight_kg: s.weight_kg,
          reps: s.reps,
          duration_sec: s.duration_sec || null,
          completed: true,
        }))
    );

    await supabase.from("workout_sets").insert(setsToInsert);

    // Update daily log workout status
    await supabase.rpc("upsert_daily_log", {
      p_user_id: userId,
      p_date: today,
      p_stretching: Object.keys(stretchDone).length > 0
        ? Object.values(stretchDone).every(Boolean)
        : null,
    });

    router.push("/workout");
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[var(--color-background)] border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-[var(--color-muted)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">{workout.name.split("—")[0].trim()}</p>
            <p className="text-xs text-[var(--color-muted)]">{formatDuration(elapsed)} · {completedSetsCount}/{totalSetsCount} sets</p>
          </div>
          <Button size="sm" variant={allDone ? "primary" : "outline"} loading={saving} onClick={finishWorkout}>
            Done
          </Button>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all"
            style={{ width: `${totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Rest timer overlay */}
      {restTimer.active && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={dismissRestTimer}>
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-[var(--color-muted)] mb-2">Rest</p>
            <p className="text-8xl font-bold font-mono tabular-nums">{restTimer.seconds}</p>
            <div className="mt-4 h-1.5 w-48 mx-auto bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-success)] rounded-full transition-all"
                style={{ width: `${(restTimer.seconds / restTimer.max) * 100}%` }}
              />
            </div>
            <Button variant="ghost" className="mt-6" onClick={dismissRestTimer}>
              Skip rest
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {workout.exercises.map((exercise, exIdx) => {
          const exerciseSets = sets[exercise.name] || [];
          const completedCount = exerciseSets.filter((s) => s.completed).length;
          const isExpanded = expandedExercise === exercise.name;
          const isFullyDone = completedCount === exercise.sets;

          return (
            <Card key={exercise.name} className={cn(isFullyDone && "border-[var(--color-success)]")}>
              <CardContent className="pt-3 pb-3">
                {/* Exercise header */}
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.name)}
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                      isFullyDone
                        ? "bg-[var(--color-success-muted)] text-[var(--color-success)]"
                        : "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                    )}>
                      {isFullyDone ? <Check className="w-3.5 h-3.5" /> : exIdx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{exercise.name}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {exercise.sets}×{exercise.reps} · {exercise.target_weight_kg}kg · {exercise.rest_sec}s rest
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted)]">{completedCount}/{exercise.sets}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--color-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />}
                  </div>
                </button>

                {/* Expanded: sets + form cues */}
                {isExpanded && (
                  <div className="mt-3 space-y-3">
                    {/* Sets table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-1 text-[10px] text-[var(--color-muted)] uppercase tracking-wider px-1">
                        <span>Set</span>
                        <span className="col-span-2 text-center">{exercise.is_timed ? "Duration (s)" : "Weight (kg)"}</span>
                        <span className="text-center">{exercise.is_timed ? "Rounds" : "Reps"}</span>
                        <span className="text-center">Done</span>
                      </div>
                      {exerciseSets.map((set, setIdx) => (
                        <div key={setIdx} className={cn(
                          "grid grid-cols-5 gap-1 items-center px-1 py-1.5 rounded-lg",
                          set.completed && "bg-[var(--color-success-muted)]"
                        )}>
                          <span className="text-sm font-medium">{setIdx + 1}</span>
                          <input
                            type="number"
                            value={exercise.is_timed ? (set.duration_sec || 30) : set.weight_kg}
                            onChange={(e) => updateSet(
                              exercise.name, setIdx,
                              exercise.is_timed ? "duration_sec" : "weight_kg",
                              parseFloat(e.target.value) || 0
                            )}
                            className="col-span-2 h-8 text-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:border-[var(--color-primary)] w-full"
                            step={exercise.is_timed ? 5 : 0.5}
                          />
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exercise.name, setIdx, "reps", parseInt(e.target.value) || 0)}
                            className="h-8 text-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:border-[var(--color-primary)] w-full"
                          />
                          <button
                            onClick={() => toggleSet(exercise.name, setIdx, exercise.rest_sec)}
                            className={cn(
                              "w-8 h-8 rounded-full mx-auto flex items-center justify-center border-2 transition-all",
                              set.completed
                                ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                                : "border-[var(--color-border)] text-transparent"
                            )}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Form cues */}
                    {exercise.form_cues && (
                      <div className="bg-[var(--color-surface-raised)] rounded-lg p-3">
                        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Form cues</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{exercise.form_cues}</p>
                      </div>
                    )}

                    {/* Video link */}
                    {exercise.video_url && (
                      <a
                        href={exercise.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-[var(--color-primary)]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Watch form video
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Daily stretches section */}
        {stretches && stretches.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Daily Stretching</h2>
            {stretches.map((stretch) => (
              <Card key={stretch.name} className={cn(stretchDone[stretch.name] && "border-[var(--color-success)]")}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{stretch.name}</p>
                      {stretch.notes && <p className="text-xs text-[var(--color-muted)] mt-0.5">{stretch.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-muted)]">{stretch.duration_sec}s</span>
                      <button
                        onClick={() => setStretchDone((prev) => ({ ...prev, [stretch.name]: !prev[stretch.name] }))}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                          stretchDone[stretch.name]
                            ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                            : "border-[var(--color-border)]"
                        )}
                      >
                        {stretchDone[stretch.name] && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Finish button */}
        <Button
          className="w-full"
          size="lg"
          variant={allDone ? "primary" : "outline"}
          loading={saving}
          onClick={finishWorkout}
        >
          {allDone ? "Finish Workout 🎯" : `Finish (${completedSetsCount}/${totalSetsCount} sets done)`}
        </Button>
      </div>
    </div>
  );
}

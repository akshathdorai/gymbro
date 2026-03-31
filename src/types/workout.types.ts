import Anthropic from "@anthropic-ai/sdk";

export type WorkoutSet = {
  exercise: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  duration_sec?: number;
  completed: boolean;
  is_timed?: boolean;
};

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  target_weight_kg: number;
  rest_sec: number;
  form_cues?: string;
  video_url?: string;
  is_timed?: boolean;
};

export type ActiveWorkoutState = {
  workoutId: string | null;
  dayKey: string;
  workoutName: string;
  startedAt: Date;
  exercises: WorkoutExercise[];
  sets: Record<string, WorkoutSet[]>; // exercise name -> sets
  currentExerciseIndex: number;
  restTimerActive: boolean;
  restTimerSeconds: number;
  elapsedSeconds: number;
};

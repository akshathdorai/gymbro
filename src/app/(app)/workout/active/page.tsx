import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveWorkoutClient } from "./ActiveWorkoutClient";

export default async function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: program } = await supabase
    .from("program")
    .select("structure, phase_number, week_number")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!program) redirect("/workout");

  const structure = program.structure as {
    days: Array<{
      day_key: string;
      name: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        target_weight_kg: number;
        rest_sec: number;
        form_cues?: string;
        video_url?: string;
        is_timed?: boolean;
      }>;
    }>;
    daily_stretches?: Array<{ name: string; duration_sec: number; notes?: string }>;
  };

  const dayKey = day || structure.days[0]?.day_key || "A";
  const dayWorkout = structure.days.find((d) => d.day_key === dayKey);

  if (!dayWorkout) redirect("/workout");

  return (
    <ActiveWorkoutClient
      userId={user.id}
      dayKey={dayKey}
      workout={dayWorkout}
      stretches={structure.daily_stretches}
      phaseNumber={program.phase_number}
      weekNumber={program.week_number}
    />
  );
}

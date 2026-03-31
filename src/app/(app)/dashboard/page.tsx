import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { todayISO, mlToLitres } from "@/lib/utils";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const [
    profileRes,
    targetsRes,
    logRes,
    mealsRes,
    workoutRes,
    weightRes,
    programRes,
  ] = await Promise.all([
    supabase.from("user_profile").select("display_name").eq("id", user.id).single(),
    supabase.from("user_targets").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("daily_log").select("*").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
    supabase.from("meals").select("calories, protein_g, carbs_g, fat_g, meal_type, name").eq("user_id", user.id).eq("log_date", today),
    supabase.from("workouts").select("id, name, completed_at").eq("user_id", user.id).eq("workout_date", today).maybeSingle(),
    supabase.from("weight_history").select("weight_kg, logged_at").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(5),
    supabase.from("program").select("structure, phase_number, week_number, name").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
  ]);

  const meals = mealsRes.data || [];
  const mealTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein_g || 0),
      carbs: acc.carbs + (m.carbs_g || 0),
      fat: acc.fat + (m.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <DashboardClient
      userName={profileRes.data?.display_name || ""}
      targets={targetsRes.data}
      log={logRes.data}
      mealTotals={mealTotals}
      workoutToday={workoutRes.data}
      weights={weightRes.data || []}
      program={programRes.data}
      today={today}
    />
  );
}

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";
import { startOfWeek, subWeeks, format } from "date-fns";

/**
 * Executes a tool call from the Claude AI coach against the Supabase database.
 * Uses the service-role client (bypasses RLS) — user identity validated at route level.
 */
export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string
): Promise<string> {
  const supabase = createServiceClient();
  const today = todayISO();

  try {
    switch (toolName) {
      case "get_todays_log": {
        const [logRes, mealsRes, workoutRes] = await Promise.all([
          supabase
            .from("daily_log")
            .select("*")
            .eq("user_id", userId)
            .eq("log_date", today)
            .maybeSingle(),
          supabase
            .from("meals")
            .select("*")
            .eq("user_id", userId)
            .eq("log_date", today)
            .order("logged_at"),
          supabase
            .from("workouts")
            .select("id, name, duration_sec, completed_at")
            .eq("user_id", userId)
            .eq("workout_date", today)
            .maybeSingle(),
        ]);

        const meals = mealsRes.data || [];
        const totals = meals.reduce(
          (acc, m) => ({
            calories: acc.calories + (m.calories || 0),
            protein: acc.protein + (m.protein_g || 0),
            carbs: acc.carbs + (m.carbs_g || 0),
            fat: acc.fat + (m.fat_g || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        return JSON.stringify({
          date: today,
          log: logRes.data,
          meals,
          meal_totals: totals,
          workout: workoutRes.data,
        });
      }

      case "get_weekly_summary": {
        const offset = (toolInput.week_offset as number) ?? 0;
        const weekStart = format(
          startOfWeek(subWeeks(new Date(), Math.abs(offset)), { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );

        const { data } = await supabase
          .from("weekly_summary")
          .select("*")
          .eq("user_id", userId)
          .eq("week_start", weekStart)
          .maybeSingle();

        const checkin = await supabase
          .from("weekly_checkin")
          .select("*")
          .eq("user_id", userId)
          .gte("week_start", weekStart)
          .lte("week_start", format(new Date(), "yyyy-MM-dd"))
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        return JSON.stringify({
          week_start: weekStart,
          summary: data,
          checkin: checkin.data,
        });
      }

      case "get_current_program": {
        const { data } = await supabase
          .from("program")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        return JSON.stringify(data || { error: "No active program found" });
      }

      case "get_weight_history": {
        const limit = (toolInput.limit as number) ?? 20;
        const { data } = await supabase
          .from("weight_history")
          .select("*")
          .eq("user_id", userId)
          .order("logged_at", { ascending: false })
          .limit(limit);

        return JSON.stringify(data || []);
      }

      case "get_user_profile": {
        const [profileRes, targetsRes] = await Promise.all([
          supabase.from("user_profile").select("*").eq("id", userId).single(),
          supabase
            .from("user_targets")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        return JSON.stringify({
          profile: profileRes.data,
          targets: targetsRes.data,
        });
      }

      case "log_daily_entry": {
        const type = toolInput.type as string;
        const date = (toolInput.date as string) || today;

        if (type === "meal") {
          const meal = toolInput.meal as Record<string, unknown>;
          const { data, error } = await supabase.from("meals").insert({
            user_id: userId,
            log_date: date,
            meal_type: meal.meal_type as string,
            name: meal.name as string,
            calories: meal.calories as number,
            protein_g: meal.protein_g as number,
            carbs_g: meal.carbs_g as number,
            fat_g: meal.fat_g as number,
            source: "manual",
          }).select().single();

          if (error) return JSON.stringify({ error: error.message });
          return JSON.stringify({ success: true, meal: data });
        }

        // For other types (steps, water, sleep, stretching)
        const updates: Record<string, unknown> = {};
        if (type === "steps") updates.steps = toolInput.steps;
        if (type === "water") updates.water_ml = toolInput.water_ml;
        if (type === "sleep") updates.sleep_hours = toolInput.sleep_hours;
        if (type === "stretching") updates.stretching_done = toolInput.stretching_done;

        const { data, error } = await supabase.rpc("upsert_daily_log", {
          p_user_id: userId,
          p_date: date,
          p_steps: updates.steps as number ?? null,
          p_water_ml: updates.water_ml as number ?? null,
          p_sleep_hours: updates.sleep_hours as number ?? null,
          p_stretching: updates.stretching_done as boolean ?? null,
          p_notes: null,
        });

        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, log: data });
      }

      case "update_program": {
        const { data: currentProgram } = await supabase
          .from("program")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        if (!currentProgram) return JSON.stringify({ error: "No active program found" });

        const structure = currentProgram.structure as {
          days: Array<{
            day_key: string;
            exercises: Array<Record<string, unknown>>;
          }>;
        };

        const changes = toolInput.changes as Array<{
          day_key: string;
          exercise_name: string;
          field: string;
          value: unknown;
        }> || [];

        // Apply changes to the structure
        for (const change of changes) {
          const day = structure.days?.find((d) => d.day_key === change.day_key);
          if (!day) continue;
          const exercise = day.exercises?.find(
            (e) => e.name === change.exercise_name
          );
          if (!exercise) continue;
          exercise[change.field] = change.value;
        }

        const newData: Record<string, unknown> = { structure };
        if (toolInput.week_number) newData.week_number = toolInput.week_number;
        if (toolInput.phase_number) newData.phase_number = toolInput.phase_number;

        // Save history before updating
        await supabase.from("program_history").insert({
          user_id: userId,
          program_id: currentProgram.id,
          change_type: "weight_update",
          old_data: currentProgram.structure,
          new_data: structure,
          changed_by: "ai",
          reason: (toolInput.reason as string) || "Coach update",
        });

        const { error } = await supabase
          .from("program")
          .update(newData)
          .eq("id", currentProgram.id);

        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, changes_applied: changes.length });
      }

      case "update_targets": {
        const reason = (toolInput.reason as string) || "Coach recommendation";

        // Get current active targets
        const { data: current } = await supabase
          .from("user_targets")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Deactivate current
        if (current) {
          await supabase
            .from("user_targets")
            .update({ is_active: false })
            .eq("id", current.id);
        }

        // Build new targets (inherit current values, override with new ones)
        const newTargets = {
          user_id: userId,
          calorie_target: (toolInput.calorie_target as number) ?? current?.calorie_target,
          protein_target_g: (toolInput.protein_target_g as number) ?? current?.protein_target_g,
          carb_target_g: (toolInput.carb_target_g as number) ?? current?.carb_target_g,
          fat_target_g: (toolInput.fat_target_g as number) ?? current?.fat_target_g,
          step_target: (toolInput.step_target as number) ?? current?.step_target,
          water_ml_target: (toolInput.water_ml_target as number) ?? current?.water_ml_target,
          sleep_hours_target: (toolInput.sleep_hours_target as number) ?? current?.sleep_hours_target,
          notes: reason,
          changed_by: "ai" as const,
          change_reason: reason,
          is_active: true,
        };

        const { data, error } = await supabase
          .from("user_targets")
          .insert(newTargets)
          .select()
          .single();

        if (error) return JSON.stringify({ error: error.message });

        // Log individual field changes for audit
        const fieldsToCheck = [
          "calorie_target", "protein_target_g", "carb_target_g",
          "fat_target_g", "step_target", "water_ml_target", "sleep_hours_target"
        ] as const;

        const logs = fieldsToCheck
          .filter(f => toolInput[f] !== undefined && current?.[f] !== toolInput[f])
          .map(f => ({
            user_id: userId,
            field: f,
            old_value: String(current?.[f] ?? ""),
            new_value: String(toolInput[f]),
            changed_by: "ai",
            reason,
          }));

        if (logs.length > 0) {
          await supabase.from("target_change_log").insert(logs);
        }

        return JSON.stringify({ success: true, new_targets: data });
      }

      case "get_progress_summary": {
        const [profileRes, weightRes, workoutsRes, targetsRes] = await Promise.all([
          supabase.from("user_profile").select("weight_start_kg, weight_target_min_kg, weight_target_max_kg, created_at").eq("id", userId).single(),
          supabase.from("weight_history").select("weight_kg, logged_at").eq("user_id", userId).order("logged_at", { ascending: false }).limit(20),
          supabase.from("workouts").select("workout_date").eq("user_id", userId).order("workout_date", { ascending: false }).limit(100),
          supabase.from("user_targets").select("*").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

        const weightData = weightRes.data || [];
        const currentWeight = weightData[0]?.weight_kg;
        const startWeight = profileRes.data?.weight_start_kg;
        const totalLost = startWeight && currentWeight ? startWeight - currentWeight : 0;
        const targetMin = profileRes.data?.weight_target_min_kg;
        const toGo = targetMin && currentWeight ? currentWeight - targetMin : null;
        const startDate = profileRes.data?.created_at ? new Date(profileRes.data.created_at) : new Date();
        const weeksElapsed = Math.floor((Date.now() - startDate.getTime()) / (7 * 86400000));

        // Trend: is weight going down?
        const recent4 = weightData.slice(0, 4);
        let trend = "neutral";
        if (recent4.length >= 2) {
          const diff = recent4[0].weight_kg - recent4[recent4.length - 1].weight_kg;
          trend = diff < -0.3 ? "declining" : diff > 0.3 ? "increasing" : "stable";
        }

        // Workout adherence (last 4 weeks)
        const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
        const recentWorkouts = (workoutsRes.data || []).filter(w => w.workout_date >= fourWeeksAgo);

        return JSON.stringify({
          start_weight_kg: startWeight,
          current_weight_kg: currentWeight,
          total_lost_kg: Math.round(totalLost * 10) / 10,
          to_goal_kg: toGo ? Math.round(toGo * 10) / 10 : null,
          target_range: `${targetMin}–${profileRes.data?.weight_target_max_kg}kg`,
          weeks_elapsed: weeksElapsed,
          weight_trend: trend,
          recent_weights: recent4,
          workouts_last_4_weeks: recentWorkouts.length,
          current_targets: targetsRes.data,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    console.error(`Tool ${toolName} error:`, err);
    return JSON.stringify({ error: String(err) });
  }
}

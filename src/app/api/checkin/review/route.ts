import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, COACH_MODEL } from "@/lib/anthropic/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data: profile } = await supabase.from("user_profile").select("display_name, weight_start_kg, weight_target_min_kg, weight_target_max_kg").eq("id", user.id).single();
  const { data: targets } = await supabase.from("user_targets").select("calorie_target, protein_target_g, step_target").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();

  const prompt = `You are a direct, no-BS personal trainer generating a weekly check-in review for ${profile?.display_name || "your client"}.

Week ${body.weekNumber} Data:
- Weight: ${body.weight_kg ? `${body.weight_kg}kg (started at ${profile?.weight_start_kg}kg, target ${profile?.weight_target_min_kg}–${profile?.weight_target_max_kg}kg)` : "Not logged"}
- Diet rating: ${body.diet_rating}/10
- Energy rating: ${body.energy_rating}/10
- Workouts done: ${body.workouts_done} (target: 3)
- Avg daily steps: ${body.avg_steps?.toLocaleString() || "unknown"} (target: ${targets?.step_target?.toLocaleString() || 8000})
- Avg daily calories: ${body.avg_calories || "unknown"} (target: ${targets?.calorie_target || 1800})
- Avg daily protein: ${body.avg_protein_g ? `${body.avg_protein_g}g` : "unknown"} (target: ${targets?.protein_target_g || 135}g)
- Avg sleep: ${body.avg_sleep_hours ? `${body.avg_sleep_hours}h` : "unknown"} (target: 7.5h)
- Water: avg ${body.avg_water_ml ? `${(body.avg_water_ml / 1000).toFixed(1)}L` : "unknown"} (target: 2.5L)

Client's words:
- Hardest thing: "${body.hardest || "Nothing noted"}"
- What went well: "${body.went_well || "Nothing noted"}"

Write a weekly review in 150-200 words. Format:
1. Lead with one thing that was genuinely good (be specific, not generic)
2. Call out the 1-2 biggest gaps (be direct, not mean)
3. Give 2-3 specific, actionable adjustments for next week
4. Close with one motivating but realistic statement

Tone: Direct. Like a PT who cares about results. No corporate wellness language. No excessive praise for mediocre performance. Short sentences.`;

  const response = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const review = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ review });
}

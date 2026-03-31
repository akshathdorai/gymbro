import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, COACH_MODEL } from "@/lib/anthropic/client";
import { onboardingSystemPrompt } from "@/lib/anthropic/system-prompt";

export const runtime = "edge";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await request.json();

  const response = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    system: onboardingSystemPrompt,
    messages: messages.length === 0
      ? [{ role: "user", content: "Hi, I just signed up. Let's get started." }]
      : messages,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ message: "Something went wrong." });
  }

  const text = content.text;

  // Check if onboarding is complete
  const completionMatch = text.match(/<ONBOARDING_COMPLETE>([\s\S]*?)<\/ONBOARDING_COMPLETE>/);
  if (completionMatch) {
    try {
      const profileData = JSON.parse(completionMatch[1].trim());
      await saveOnboardingData(user.id, profileData, supabase);

      const displayText = text.replace(/<ONBOARDING_COMPLETE>[\s\S]*?<\/ONBOARDING_COMPLETE>/, "").trim();
      return NextResponse.json({ message: displayText, complete: true });
    } catch (e) {
      console.error("Failed to parse onboarding data:", e);
    }
  }

  return NextResponse.json({ message: text, complete: false });
}

async function saveOnboardingData(userId: string, data: Record<string, unknown>, supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  // Update user profile
  await supabase.from("user_profile").upsert({
    id: userId,
    display_name: (data.name as string) || undefined,
    age: (data.age as number) || undefined,
    gender: (data.gender as string) || undefined,
    height_cm: (data.height_cm as number) || undefined,
    weight_start_kg: (data.current_weight_kg as number) || undefined,
    weight_target_min_kg: (data.target_weight_min_kg as number) || undefined,
    weight_target_max_kg: (data.target_weight_max_kg as number) || undefined,
    injuries: (data.injuries as string) || undefined,
    equipment: (data.equipment as string[]) || undefined,
    schedule_notes: (data.schedule_notes as string) || undefined,
    onboarding_complete: true,
  });

  // Set initial targets
  await supabase.from("user_targets").insert({
    user_id: userId,
    calorie_target: (data.calorie_target as number) || 2000,
    protein_target_g: (data.protein_target_g as number) || 150,
    carb_target_g: (data.carb_target_g as number) || 200,
    fat_target_g: (data.fat_target_g as number) || 65,
    step_target: (data.step_target as number) || 8000,
    water_ml_target: (data.water_ml_target as number) || 2500,
    sleep_hours_target: (data.sleep_hours_target as number) || 7.5,
    notes: "Initial onboarding targets",
    changed_by: "ai",
    change_reason: "Set during onboarding intake",
    is_active: true,
  });

  // Create initial program if provided
  if (data.program) {
    await supabase.from("program").insert({
      user_id: userId,
      phase_number: 1,
      week_number: 1,
      name: "Phase 1 — Foundation",
      structure: data.program as Record<string, unknown>,
      is_active: true,
    });
  }

  // Log starting weight
  if (data.current_weight_kg) {
    await supabase.from("weight_history").insert({
      user_id: userId,
      weight_kg: data.current_weight_kg as number,
      logged_at: new Date().toISOString().split("T")[0],
      notes: "Starting weight",
    });
  }
}

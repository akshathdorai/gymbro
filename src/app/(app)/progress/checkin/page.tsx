"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { todayISO, weekNumber } from "@/lib/utils";

export default function CheckinPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    weight_kg: "",
    diet_rating: 7,
    energy_rating: 7,
    hardest: "",
    went_well: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiReview, setAiReview] = useState("");

  async function submit() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const today = todayISO();
    const weekNum = weekNumber();

    // Get this week's aggregate data
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const [logsRes, workoutsRes] = await Promise.all([
      supabase.from("daily_log").select("steps, water_ml, sleep_hours").eq("user_id", user.id).gte("log_date", weekStartStr).lte("log_date", today),
      supabase.from("workouts").select("id").eq("user_id", user.id).gte("workout_date", weekStartStr).lte("workout_date", today),
    ]);

    const mealsRes = await supabase.from("meals").select("calories, protein_g").eq("user_id", user.id).gte("log_date", weekStartStr).lte("log_date", today);

    const logs = logsRes.data || [];
    const workouts = workoutsRes.data || [];
    const meals = mealsRes.data || [];

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const avgSteps = avg(logs.map((l) => l.steps || 0).filter(Boolean));
    const avgWater = avg(logs.map((l) => l.water_ml || 0).filter(Boolean));
    const avgSleep = avg(logs.map((l) => l.sleep_hours || 0).filter(Boolean));
    const avgCal = avg(meals.map((m) => m.calories || 0).filter(Boolean));
    const avgProtein = avg(meals.map((m) => m.protein_g || 0).filter(Boolean));

    // Generate AI review
    const res = await fetch("/api/checkin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekNumber: weekNum,
        weight_kg: parseFloat(form.weight_kg) || null,
        diet_rating: form.diet_rating,
        energy_rating: form.energy_rating,
        hardest: form.hardest,
        went_well: form.went_well,
        workouts_done: workouts.length,
        avg_steps: avgSteps,
        avg_calories: avgCal,
        avg_protein_g: avgProtein,
        avg_sleep_hours: avgSleep,
        avg_water_ml: avgWater,
      }),
    });
    const { review } = await res.json();
    setAiReview(review);

    // Save to DB
    await supabase.from("weekly_checkin").upsert({
      user_id: user.id,
      week_number: weekNum,
      week_start: weekStartStr,
      weight_kg: parseFloat(form.weight_kg) || null,
      diet_rating: form.diet_rating,
      energy_rating: form.energy_rating,
      hardest: form.hardest,
      went_well: form.went_well,
      workouts_done: workouts.length,
      workouts_target: 3,
      avg_steps: avgSteps,
      avg_calories: avgCal,
      avg_protein_g: avgProtein,
      avg_sleep_hours: avgSleep,
      avg_water_ml: avgWater,
      ai_review: review,
    }, { onConflict: "user_id,week_number" });

    if (form.weight_kg) {
      await supabase.from("weight_history").upsert({
        user_id: user.id,
        weight_kg: parseFloat(form.weight_kg),
        logged_at: today,
        notes: `Week ${weekNum} check-in`,
      }, { onConflict: "user_id,logged_at" });
    }

    setLoading(false);
  }

  const weekNum = weekNumber();

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--color-muted)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Week {weekNum} Check-in</h1>
          <p className="text-xs text-[var(--color-muted)]">Weekly progress review</p>
        </div>
      </div>

      {aiReview ? (
        <div className="space-y-4">
          <Card className="border-[var(--color-primary)]">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-2">Coach Review</p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-foreground)]">
                {aiReview}
              </div>
            </CardContent>
          </Card>
          <Button className="w-full" onClick={() => router.push("/progress")}>
            Back to Progress
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Morning weight (kg)"
            type="number"
            step="0.1"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
            placeholder="e.g. 81.2"
          />

          <RatingInput
            label="Diet adherence"
            sublabel="How well did you stick to the plan?"
            value={form.diet_rating}
            onChange={(v) => setForm({ ...form, diet_rating: v })}
          />

          <RatingInput
            label="Energy levels"
            sublabel="How did you feel overall?"
            value={form.energy_rating}
            onChange={(v) => setForm({ ...form, energy_rating: v })}
          />

          <Textarea
            label="What was hardest this week?"
            value={form.hardest}
            onChange={(e) => setForm({ ...form, hardest: e.target.value })}
            placeholder="Be honest."
            rows={3}
          />

          <Textarea
            label="What went well?"
            value={form.went_well}
            onChange={(e) => setForm({ ...form, went_well: e.target.value })}
            placeholder="Wins from the week."
            rows={3}
          />

          <Button
            className="w-full"
            size="lg"
            onClick={submit}
            loading={loading}
          >
            {loading ? "Generating review..." : "Submit check-in"}
          </Button>
        </div>
      )}
    </div>
  );
}

function RatingInput({ label, sublabel, value, onChange }: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        <p className="text-xs text-[var(--color-muted)]">{sublabel}</p>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded text-xs font-medium transition-all ${
              n <= value
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-muted)]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--color-muted)] text-right">{value}/10</p>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Camera, Search, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { todayISO, progressPct } from "@/lib/utils";
import type { Meal } from "@/types/database.types";

const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner", "other"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", snack: "Snack (3:30)", dinner: "Dinner", other: "Other"
};

export default async function MealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const [mealsRes, targetsRes] = await Promise.all([
    supabase.from("meals").select("*").eq("user_id", user.id).eq("log_date", today).order("logged_at"),
    supabase.from("user_targets").select("calorie_target, protein_target_g, carb_target_g, fat_target_g").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const meals = mealsRes.data || [];
  const targets = targetsRes.data;

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein_g || 0),
      carbs: acc.carbs + (m.carbs_g || 0),
      fat: acc.fat + (m.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieTarget = targets?.calorie_target || 1800;
  const proteinTarget = targets?.protein_target_g || 135;

  const mealsByType = MEAL_ORDER.reduce((acc, type) => {
    acc[type] = meals.filter((m) => m.meal_type === type);
    return acc;
  }, {} as Record<string, Meal[]>);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meals</h1>
        <Link href="/meals/log">
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </Link>
      </div>

      {/* Daily totals */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{totals.calories}</span>
            <span className="text-sm text-[var(--color-muted)]">/ {calorieTarget} kcal</span>
          </div>
          <ProgressBar value={totals.calories} max={calorieTarget} color="var(--color-calories)" />
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: "Protein", value: Math.round(totals.protein), target: proteinTarget, unit: "g", color: "var(--color-protein)" },
              { label: "Carbs", value: Math.round(totals.carbs), target: targets?.carb_target_g || 180, unit: "g", color: "var(--color-carbs)" },
              { label: "Fat", value: Math.round(totals.fat), target: targets?.fat_target_g || 55, unit: "g", color: "var(--color-fat)" },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted)]">{m.label}</span>
                  <span style={{ color: m.color }}>{m.value}g</span>
                </div>
                <ProgressBar value={m.value} max={m.target} color={m.color} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick log buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/meals/log?mode=photo">
          <Button variant="outline" className="w-full gap-1.5 text-xs h-10">
            <Camera className="w-3.5 h-3.5" />
            Photo
          </Button>
        </Link>
        <Link href="/meals/log?mode=search">
          <Button variant="outline" className="w-full gap-1.5 text-xs h-10">
            <Search className="w-3.5 h-3.5" />
            Search
          </Button>
        </Link>
        <Link href="/meals/log?mode=saved">
          <Button variant="outline" className="w-full gap-1.5 text-xs h-10">
            <Star className="w-3.5 h-3.5" />
            Saved
          </Button>
        </Link>
      </div>

      {/* Meals by type */}
      {MEAL_ORDER.map((type) => {
        const typeMeals = mealsByType[type];
        const typeTotals = typeMeals.reduce((acc, m) => ({
          cal: acc.cal + (m.calories || 0),
          protein: acc.protein + (m.protein_g || 0),
        }), { cal: 0, protein: 0 });

        return (
          <div key={type}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)]">{MEAL_LABELS[type]}</h3>
              {typeMeals.length > 0 && (
                <span className="text-xs text-[var(--color-muted)]">
                  {typeTotals.cal} kcal · {Math.round(typeTotals.protein)}g protein
                </span>
              )}
            </div>
            <div className="space-y-2">
              {typeMeals.map((meal) => (
                <Card key={meal.id} elevated>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{meal.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          {meal.calories && <span className="text-xs text-[var(--color-muted)]">{meal.calories} kcal</span>}
                          {meal.protein_g && <span className="text-xs text-[var(--color-protein)]">{Math.round(meal.protein_g)}g P</span>}
                          {meal.carbs_g && <span className="text-xs text-[var(--color-carbs)]">{Math.round(meal.carbs_g)}g C</span>}
                          {meal.fat_g && <span className="text-xs text-[var(--color-fat)]">{Math.round(meal.fat_g)}g F</span>}
                        </div>
                      </div>
                      {meal.source === "ai_photo" && <Badge variant="info">AI</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Link href={`/meals/log?type=${type}`}>
                <button className="w-full py-2 text-xs text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                  + Add {MEAL_LABELS[type].toLowerCase()}
                </button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

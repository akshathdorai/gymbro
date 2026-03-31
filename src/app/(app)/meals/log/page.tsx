"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Search, Star, ChevronLeft, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { todayISO, cn } from "@/lib/utils";

type Mode = "select" | "photo" | "search" | "saved" | "manual" | "confirm";
type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

interface MealData {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  grams?: number;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack", "other"];

export default function LogMealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "select";
  const initialType = (searchParams.get("type") as MealType) || "lunch";

  const [mode, setMode] = useState<Mode>(initialMode === "select" ? "select" : initialMode);
  const [mealType, setMealType] = useState<MealType>(initialType);
  const [mealData, setMealData] = useState<MealData>({ name: "", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [savedMeals, setSavedMeals] = useState<MealData[]>([]);
  const [searchResults, setSearchResults] = useState<MealData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoAnalyzed, setPhotoAnalyzed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadSavedMeals() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("saved_meals").select("*").eq("user_id", user.id).order("use_count", { ascending: false }).limit(20);
    if (data) setSavedMeals(data.map(m => ({ name: m.name, calories: m.calories || 0, protein_g: m.protein_g || 0, carbs_g: m.carbs_g || 0, fat_g: m.fat_g || 0, grams: m.grams || undefined })));
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      const res = await fetch("/api/meals/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (data.meal) {
        setMealData(data.meal);
        setPhotoAnalyzed(true);
        setMode("confirm");
      }
      setPhotoLoading(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleFoodSearch(q: string) {
    if (!q.trim()) return;
    setSearchLoading(true);
    const res = await fetch(`/api/meals/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.foods || []);
    setSearchLoading(false);
  }

  async function saveMeal() {
    if (!mealData.name) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("meals").insert({
      user_id: user.id,
      log_date: todayISO(),
      meal_type: mealType,
      name: mealData.name,
      calories: mealData.calories || null,
      protein_g: mealData.protein_g || null,
      carbs_g: mealData.carbs_g || null,
      fat_g: mealData.fat_g || null,
      grams: mealData.grams || null,
      source: photoAnalyzed ? "ai_photo" : "manual",
    });

    router.push("/meals");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--color-muted)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Log Meal</h1>
      </div>

      {/* Meal type selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {MEAL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setMealType(t)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              mealType === t
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)]"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Mode: select */}
      {mode === "select" && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Camera, label: "Photo", desc: "AI estimates macros from photo", mode: "photo" as const },
            { icon: Search, label: "Search foods", desc: "Search USDA food database", mode: "search" as const },
            { icon: Star, label: "Saved meals", desc: "Quick log a frequent meal", mode: "saved" as const },
            { icon: Check, label: "Manual entry", desc: "Enter macros directly", mode: "manual" as const },
          ].map(({ icon: Icon, label, desc, mode: m }) => (
            <Card key={m} className="cursor-pointer active:scale-95 transition-transform" onClick={() => {
              setMode(m);
              if (m === "saved") loadSavedMeals();
            }}>
              <CardContent className="pt-4 pb-4">
                <Icon className="w-6 h-6 text-[var(--color-primary)] mb-2" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mode: photo */}
      {mode === "photo" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 pb-6 flex flex-col items-center">
              {photoLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                  <p className="text-sm text-[var(--color-muted)]">Analyzing photo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Camera className="w-12 h-12 text-[var(--color-muted)]" />
                  <p className="text-sm text-[var(--color-muted)] text-center">
                    Take a photo of your meal and AI will estimate the macros
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                  <Button onClick={() => fileRef.current?.click()}>
                    Take photo
                  </Button>
                  <button onClick={() => { fileRef.current!.removeAttribute("capture"); fileRef.current?.click(); }} className="text-xs text-[var(--color-primary)]">
                    Choose from gallery
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mode: search */}
      {mode === "search" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search foods (e.g. chappati, rice, paneer)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFoodSearch(searchQuery)}
              className="flex-1"
            />
            <Button onClick={() => handleFoodSearch(searchQuery)} loading={searchLoading}>
              {!searchLoading && <Search className="w-4 h-4" />}
            </Button>
          </div>
          {searchResults.map((food, i) => (
            <Card key={i} className="cursor-pointer active:scale-[0.99]" elevated onClick={() => {
              setMealData(food);
              setMode("confirm");
            }}>
              <CardContent className="pt-3 pb-3">
                <p className="text-sm font-medium">{food.name}</p>
                <div className="flex gap-3 mt-0.5 text-xs text-[var(--color-muted)]">
                  <span>{food.calories} kcal</span>
                  <span className="text-[var(--color-protein)]">{food.protein_g}g P</span>
                  <span className="text-[var(--color-carbs)]">{food.carbs_g}g C</span>
                  <span className="text-[var(--color-fat)]">{food.fat_g}g F</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mode: saved */}
      {mode === "saved" && (
        <div className="space-y-2">
          {savedMeals.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-8">
              No saved meals yet. Log a meal and save it for quick access.
            </p>
          ) : (
            savedMeals.map((meal, i) => (
              <Card key={i} className="cursor-pointer" elevated onClick={() => {
                setMealData(meal);
                setMode("confirm");
              }}>
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium">{meal.name}</p>
                  <div className="flex gap-3 mt-0.5 text-xs text-[var(--color-muted)]">
                    <span>{meal.calories} kcal</span>
                    <span className="text-[var(--color-protein)]">{meal.protein_g}g P</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Mode: manual */}
      {mode === "manual" && (
        <MealForm data={mealData} onChange={setMealData} onSubmit={() => setMode("confirm")} />
      )}

      {/* Mode: confirm */}
      {mode === "confirm" && (
        <div className="space-y-4">
          {photoAnalyzed && (
            <Badge variant="info" className="mb-1">AI Estimated</Badge>
          )}
          <MealForm data={mealData} onChange={setMealData} onSubmit={saveMeal} submitLabel="Log meal" loading={saving} />
          <Button variant="ghost" className="w-full" onClick={() => setMode("manual")}>
            Edit manually
          </Button>
        </div>
      )}
    </div>
  );
}

function MealForm({
  data, onChange, onSubmit, submitLabel = "Continue", loading = false
}: {
  data: MealData;
  onChange: (d: MealData) => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Input
        label="Meal name"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        placeholder="e.g. Dal rice + salad"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Calories"
          type="number"
          value={data.calories || ""}
          onChange={(e) => onChange({ ...data, calories: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
        <Input
          label="Protein (g)"
          type="number"
          value={data.protein_g || ""}
          onChange={(e) => onChange({ ...data, protein_g: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
        <Input
          label="Carbs (g)"
          type="number"
          value={data.carbs_g || ""}
          onChange={(e) => onChange({ ...data, carbs_g: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
        <Input
          label="Fat (g)"
          type="number"
          value={data.fat_g || ""}
          onChange={(e) => onChange({ ...data, fat_g: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      <Button className="w-full" size="lg" onClick={onSubmit} loading={loading} disabled={!data.name}>
        {submitLabel}
      </Button>
    </div>
  );
}

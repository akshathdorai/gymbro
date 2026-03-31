import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Camera, ClipboardList, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeightChart } from "./WeightChart";
import { WeightLogForm } from "./WeightLogForm";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [weightRes, checkinsRes, profileRes, photosRes] = await Promise.all([
    supabase.from("weight_history").select("*").eq("user_id", user.id).order("logged_at", { ascending: true }),
    supabase.from("weekly_checkin").select("*").eq("user_id", user.id).order("week_number", { ascending: false }).limit(5),
    supabase.from("user_profile").select("weight_start_kg, weight_target_min_kg, weight_target_max_kg, display_name").eq("id", user.id).single(),
    supabase.from("progress_photos").select("id, taken_at, angle, storage_key").eq("user_id", user.id).order("taken_at", { ascending: false }).limit(9),
  ]);

  const weights = weightRes.data || [];
  const checkins = checkinsRes.data || [];
  const profile = profileRes.data;
  const photos = photosRes.data || [];

  const currentWeight = weights[weights.length - 1]?.weight_kg;
  const startWeight = profile?.weight_start_kg;
  const targetMin = profile?.weight_target_min_kg;
  const lostSoFar = startWeight && currentWeight ? (startWeight - currentWeight) : 0;
  const toGo = targetMin && currentWeight ? (currentWeight - targetMin) : null;

  const today = new Date().toISOString().split("T")[0];
  const isSunday = new Date().getDay() === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        {isSunday && (
          <Badge variant="warning">Check-in day</Badge>
        )}
      </div>

      {/* Weight summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Current Weight</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">{currentWeight || "—"}</span>
                {currentWeight && <span className="text-sm text-[var(--color-muted)] mb-0.5">kg</span>}
              </div>
            </div>
            <div className="text-right">
              {lostSoFar > 0 && <p className="text-sm text-[var(--color-success)]">−{lostSoFar.toFixed(1)}kg</p>}
              {toGo !== null && <p className="text-xs text-[var(--color-muted)]">{toGo.toFixed(1)}kg to go</p>}
              {targetMin && <p className="text-xs text-[var(--color-muted)]">Target: {targetMin}kg</p>}
            </div>
          </div>

          <WeightLogForm userId={user.id} today={today} />

          {weights.length > 1 && (
            <WeightChart
              weights={weights.map((w) => ({ date: w.logged_at, weight: w.weight_kg }))}
              target={profile?.weight_target_min_kg || undefined}
              start={profile?.weight_start_kg || undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Weekly check-in CTA */}
      <Link href="/progress/checkin">
        <Card className={`cursor-pointer active:scale-[0.99] transition-transform ${isSunday ? "border-[var(--color-warning)]" : ""}`}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <p className="text-sm font-medium">Weekly Check-in</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {checkins[0] ? `Last: Week ${checkins[0].week_number}` : "Not started yet"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Recent check-ins */}
      {checkins.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Previous Check-ins</h2>
          {checkins.map((c) => (
            <Card key={c.id} elevated>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Week {c.week_number}</p>
                  <div className="flex items-center gap-2">
                    {c.weight_kg && <span className="text-xs">{c.weight_kg}kg</span>}
                    <span className="text-xs text-[var(--color-muted)]">{format(new Date(c.week_start), "MMM d")}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {c.workouts_done !== null && (
                    <div>
                      <p className="text-[var(--color-muted)]">Workouts</p>
                      <p className="font-medium">{c.workouts_done}/{c.workouts_target}</p>
                    </div>
                  )}
                  {c.avg_steps && <div><p className="text-[var(--color-muted)]">Steps</p><p className="font-medium">{Math.round((c.avg_steps || 0) / 1000)}k</p></div>}
                  {c.avg_calories && <div><p className="text-[var(--color-muted)]">Cal</p><p className="font-medium">{c.avg_calories}</p></div>}
                  {c.avg_sleep_hours && <div><p className="text-[var(--color-muted)]">Sleep</p><p className="font-medium">{c.avg_sleep_hours}h</p></div>}
                </div>
                {c.ai_review && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-2 line-clamp-2">{c.ai_review}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Progress Photos</h2>
          <Link href="/progress/photos" className="text-xs text-[var(--color-primary)]">View all</Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Link href="/progress/photos/upload">
            <div className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-1 text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
              <Camera className="w-5 h-5" />
              <span className="text-[10px]">Add photo</span>
            </div>
          </Link>
          {photos.slice(0, 5).map((p) => (
            <Link key={p.id} href="/progress/photos">
              <div className="aspect-square rounded-lg bg-[var(--color-surface-raised)] flex flex-col items-center justify-center text-center p-2">
                <p className="text-xs font-medium capitalize">{p.angle}</p>
                <p className="text-[10px] text-[var(--color-muted)]">{format(new Date(p.taken_at), "MMM d")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

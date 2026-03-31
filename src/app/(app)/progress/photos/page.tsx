import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, Camera, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false });

  // Group by date
  const byDate: Record<string, typeof photos> = {};
  (photos || []).forEach((p) => {
    if (!byDate[p.taken_at]) byDate[p.taken_at] = [];
    byDate[p.taken_at]!.push(p);
  });

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/progress" className="text-[var(--color-muted)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Progress Photos</h1>
        </div>
        <div className="flex gap-2">
          {dates.length >= 2 && (
            <Link href="/progress/photos/compare">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                Compare
              </Button>
            </Link>
          )}
          <Link href="/progress/photos/upload">
            <Button size="sm" className="gap-1">
              <Camera className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      {dates.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Camera className="w-10 h-10 text-[var(--color-muted)]" />
            <div className="text-center">
              <p className="text-sm font-medium">No photos yet</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Take front, side, and back photos every 4 weeks to track visual progress.
              </p>
            </div>
            <Link href="/progress/photos/upload">
              <Button>Take first photo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        dates.map((date) => (
          <div key={date}>
            <p className="text-sm font-semibold text-[var(--color-muted)] mb-2">
              {format(new Date(date), "MMMM d, yyyy")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {byDate[date]?.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg bg-[var(--color-surface-raised)] flex flex-col items-center justify-center">
                  <Camera className="w-6 h-6 text-[var(--color-muted)]" />
                  <p className="text-xs text-[var(--color-muted)] mt-1 capitalize">{photo.angle}</p>
                </div>
              ))}
              {["front", "side", "back"]
                .filter((angle) => !byDate[date]?.some((p) => p.angle === angle))
                .map((angle) => (
                  <Link key={angle} href={`/progress/photos/upload?angle=${angle}&date=${date}`}>
                    <div className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-primary)] transition-colors">
                      <Camera className="w-5 h-5" />
                      <p className="text-[10px] mt-1 capitalize">{angle}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

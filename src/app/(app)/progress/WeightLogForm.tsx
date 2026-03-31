"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function WeightLogForm({ userId, today }: { userId: string; today: string }) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const val = parseFloat(weight);
    if (!val || val < 30 || val > 300) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("weight_history").upsert(
      { user_id: userId, weight_kg: val, logged_at: today, notes: "Daily weigh-in" },
      { onConflict: "user_id,logged_at" }
    );
    setWeight("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 mb-3">
      <Input
        type="number"
        step="0.1"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="Log weight (kg)"
        className="flex-1"
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      <Button onClick={save} loading={saving} disabled={!weight} size="md">
        Log
      </Button>
    </div>
  );
}

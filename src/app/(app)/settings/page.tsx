"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Target, Moon, Sun, Bell, LogOut, ChevronRight,
  Scale, Ruler, Flame, Dumbbell, Droplets, Footprints, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("gymbro-theme") || "dark";
    setTheme(stored as "dark" | "light");
    document.documentElement.classList.toggle("light", stored === "light");

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const [profileRes, targetsRes] = await Promise.all([
        supabase.from("user_profile").select("*").eq("id", user.id).single(),
        supabase.from("user_targets").select("*").eq("user_id", user.id).eq("is_active", true).single(),
      ]);
      setProfile(profileRes.data);
      setTargets(targetsRes.data);
      setLoading(false);
    };
    load();
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("gymbro-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-2xl font-bold text-white">
              {profile?.display_name?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{profile?.display_name ?? "—"}</p>
              <p className="text-sm text-[var(--color-muted)] truncate">{user?.email}</p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Phase {profile?.current_phase ?? 1} · Week {profile?.current_week ?? 1}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body stats */}
      <section>
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Body</p>
        <Card>
          <CardContent className="pt-3 pb-3 divide-y divide-[var(--color-border)]">
            <SettingsRow icon={Scale} label="Current weight" value={profile ? `${profile.weight_start_kg} kg` : "—"} />
            <SettingsRow icon={Target} label="Target weight" value={profile ? `${profile.weight_target_min_kg}–${profile.weight_target_max_kg} kg` : "—"} />
            <SettingsRow icon={Ruler} label="Height" value={profile ? `${profile.height_cm} cm` : "—"} />
          </CardContent>
        </Card>
      </section>

      {/* Daily targets */}
      <section>
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Daily Targets</p>
        <Card>
          <CardContent className="pt-3 pb-3 divide-y divide-[var(--color-border)]">
            <SettingsRow icon={Flame} label="Calories" value={targets ? `${targets.calorie_target} kcal` : "—"} />
            <SettingsRow icon={Dumbbell} label="Protein" value={targets ? `${targets.protein_target_g}g` : "—"} />
            <SettingsRow icon={Droplets} label="Water" value={targets ? `${(targets.water_ml_target / 1000).toFixed(1)}L` : "—"} />
            <SettingsRow icon={Footprints} label="Steps" value={targets ? `${targets.step_target.toLocaleString()}` : "—"} />
            <SettingsRow icon={Moon} label="Sleep" value={targets ? `${targets.sleep_hours_target}h` : "—"} />
          </CardContent>
        </Card>
        <p className="text-xs text-[var(--color-muted)] mt-1.5 px-1">
          Ask Coach to update your targets anytime.
        </p>
      </section>

      {/* App */}
      <section>
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">App</p>
        <Card>
          <CardContent className="pt-3 pb-3 divide-y divide-[var(--color-border)]">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full py-2.5 text-sm"
            >
              <div className="flex items-center gap-3">
                {theme === "dark"
                  ? <Moon className="w-4 h-4 text-[var(--color-muted)]" />
                  : <Sun className="w-4 h-4 text-[var(--color-muted)]" />
                }
                <span>Appearance</span>
              </div>
              <span className="text-[var(--color-muted)] text-xs capitalize">{theme} mode</span>
            </button>
            <SettingsRow icon={Bell} label="Notifications" value="Via push" />
            <SettingsRow icon={Shield} label="Data" value="Stored securely in Supabase" />
          </CardContent>
        </Card>
      </section>

      {/* Account */}
      <section>
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1">Account</p>
        <Card>
          <CardContent className="pt-3 pb-3">
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full py-2.5 text-sm text-[var(--color-danger)]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </CardContent>
        </Card>
      </section>

      <p className="text-center text-xs text-[var(--color-muted)] pb-2">GymBro · Phase 1</p>
    </div>
  );
}

function SettingsRow({
  icon: Icon, label, value, onPress
}: {
  icon: any; label: string; value: string; onPress?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-[var(--color-muted)]" />
        <span>{label}</span>
      </div>
      <span className="text-[var(--color-muted)] text-xs">{value}</span>
    </div>
  );
}

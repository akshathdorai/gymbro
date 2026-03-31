import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { anthropic, COACH_MODEL } from "@/lib/anthropic/client";
import { sendPushNotification } from "@/lib/push/send-notification";

export const maxDuration = 60;

// Called by Vercel Cron — checks all users for notification triggers
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().split("T")[0];

  // Get all users with push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth_key");

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const sub of subscriptions) {
    try {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", sub.user_id)
        .single();

      // Check quiet hours
      const quietStart = parseInt((prefs?.quiet_start || "22:00").split(":")[0]);
      const quietEnd = parseInt((prefs?.quiet_end || "08:00").split(":")[0]);
      const isQuietHour = quietStart <= hour || hour < quietEnd;
      if (isQuietHour) continue;

      // Determine which trigger applies at this hour
      let notificationPayload: { title: string; body: string; url: string } | null = null;

      const { data: log } = await supabase
        .from("daily_log")
        .select("steps, water_ml, sleep_hours")
        .eq("user_id", sub.user_id)
        .eq("log_date", today)
        .maybeSingle();

      const { data: meals } = await supabase
        .from("meals")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("log_date", today)
        .limit(1);

      const { data: workout } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("workout_date", today)
        .maybeSingle();

      // 1pm: Water reminder if nothing logged
      if (hour === 13 && prefs?.water_reminder && (!log || !log.water_ml)) {
        notificationPayload = {
          title: "GymBro",
          body: "You haven't logged any water today. Get drinking.",
          url: "/dashboard",
        };
      }
      // 2pm: Daily check if no log
      else if (hour === 14 && prefs?.daily_check_enabled && !log && (!meals || meals.length === 0)) {
        notificationPayload = {
          title: "GymBro",
          body: "Hey, no updates today. How's the diet going? Did you get your workout in?",
          url: "/chat",
        };
      }
      // 9pm: No meals logged
      else if (hour === 21 && (!meals || meals.length === 0)) {
        notificationPayload = {
          title: "GymBro",
          body: "No meals logged today. What did you eat? Be honest.",
          url: "/meals/log",
        };
      }
      // 11:45pm: Bedtime
      else if (hour === 23 && prefs?.bedtime_reminder) {
        notificationPayload = {
          title: "GymBro",
          body: "Phone on charger. Bed. Now.",
          url: "/dashboard",
        };
      }

      if (notificationPayload) {
        // Use AI to personalize the message
        try {
          const aiRes = await anthropic.messages.create({
            model: COACH_MODEL,
            max_tokens: 100,
            messages: [{
              role: "user",
              content: `Rewrite this notification as a direct, slightly sarcastic personal trainer text message (under 80 chars): "${notificationPayload.body}" Keep the core message but make it feel like a real PT texting, not a wellness app.`,
            }],
          });
          if (aiRes.content[0].type === "text") {
            notificationPayload.body = aiRes.content[0].text.replace(/^["']|["']$/g, "");
          }
        } catch {
          // Use original message if AI fails
        }

        await sendPushNotification(sub, notificationPayload);

        // Log notification to chat thread
        await supabase.from("chat_messages").insert({
          user_id: sub.user_id,
          role: "assistant",
          content: `[Notification] ${notificationPayload.body}`,
        });

        sent++;
      }
    } catch (err) {
      console.error(`Error processing user ${sub.user_id}:`, err);
    }
  }

  return NextResponse.json({ sent, checked: subscriptions.length });
}

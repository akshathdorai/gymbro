import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push/send-notification";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const isSunday = now.getDay() === 0;
  if (!isSunday) return NextResponse.json({ skipped: "Not Sunday" });

  const supabase = createServiceClient();
  const today = now.toISOString().split("T")[0];

  // Get users who haven't done their weekly check-in yet
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth_key");

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const sub of subscriptions) {
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("weekly_checkin_reminder")
      .eq("user_id", sub.user_id)
      .single();

    if (!prefs?.weekly_checkin_reminder) continue;

    // Check if check-in was done this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const { data: checkin } = await supabase
      .from("weekly_checkin")
      .select("id")
      .eq("user_id", sub.user_id)
      .gte("week_start", weekStartStr)
      .maybeSingle();

    if (checkin) continue; // Already done

    await sendPushNotification(sub, {
      title: "GymBro",
      body: "It's check-in day. Weigh yourself and come talk to me.",
      url: "/progress/checkin",
    });

    await supabase.from("chat_messages").insert({
      user_id: sub.user_id,
      role: "assistant",
      content: "It's Sunday. Weekly check-in time. Weigh yourself, then come tell me how the week went.",
    });

    sent++;
  }

  return NextResponse.json({ sent });
}

-- Migration 0002: RLS Policies
-- Enable RLS on all tables and add per-user CRUD policies

-- Helper: all policies use (SELECT auth.uid()) for performance

-- ============================================================
-- user_profile
-- ============================================================
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profile_select" ON public.user_profile FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "user_profile_insert" ON public.user_profile FOR INSERT WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "user_profile_update" ON public.user_profile FOR UPDATE USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "user_profile_delete" ON public.user_profile FOR DELETE USING (id = (SELECT auth.uid()));

-- ============================================================
-- user_targets
-- ============================================================
ALTER TABLE public.user_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_targets_select" ON public.user_targets FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_targets_insert" ON public.user_targets FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "user_targets_update" ON public.user_targets FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "user_targets_delete" ON public.user_targets FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- daily_log
-- ============================================================
ALTER TABLE public.daily_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_log_select" ON public.daily_log FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "daily_log_insert" ON public.daily_log FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "daily_log_update" ON public.daily_log FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "daily_log_delete" ON public.daily_log FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- meals
-- ============================================================
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meals_select" ON public.meals FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "meals_insert" ON public.meals FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "meals_update" ON public.meals FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "meals_delete" ON public.meals FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- saved_meals
-- ============================================================
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_meals_select" ON public.saved_meals FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "saved_meals_insert" ON public.saved_meals FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "saved_meals_update" ON public.saved_meals FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "saved_meals_delete" ON public.saved_meals FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- workouts
-- ============================================================
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workouts_select" ON public.workouts FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "workouts_insert" ON public.workouts FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "workouts_update" ON public.workouts FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "workouts_delete" ON public.workouts FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- workout_sets
-- ============================================================
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_sets_select" ON public.workout_sets FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "workout_sets_insert" ON public.workout_sets FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "workout_sets_update" ON public.workout_sets FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "workout_sets_delete" ON public.workout_sets FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- weight_history
-- ============================================================
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weight_history_select" ON public.weight_history FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "weight_history_insert" ON public.weight_history FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weight_history_update" ON public.weight_history FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weight_history_delete" ON public.weight_history FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- weekly_checkin
-- ============================================================
ALTER TABLE public.weekly_checkin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_checkin_select" ON public.weekly_checkin FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_checkin_insert" ON public.weekly_checkin FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_checkin_update" ON public.weekly_checkin FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_checkin_delete" ON public.weekly_checkin FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- progress_photos
-- ============================================================
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_photos_select" ON public.progress_photos FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "progress_photos_insert" ON public.progress_photos FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "progress_photos_update" ON public.progress_photos FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "progress_photos_delete" ON public.progress_photos FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- program
-- ============================================================
ALTER TABLE public.program ENABLE ROW LEVEL SECURITY;
CREATE POLICY "program_select" ON public.program FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "program_insert" ON public.program FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "program_update" ON public.program FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "program_delete" ON public.program FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- program_history
-- ============================================================
ALTER TABLE public.program_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "program_history_select" ON public.program_history FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "program_history_insert" ON public.program_history FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- chat_messages
-- ============================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "chat_messages_delete" ON public.chat_messages FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- push_subscriptions
-- ============================================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- notification_preferences
-- ============================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_select" ON public.notification_preferences FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notif_prefs_insert" ON public.notification_preferences FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "notif_prefs_update" ON public.notification_preferences FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- target_change_log
-- ============================================================
ALTER TABLE public.target_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "target_change_log_select" ON public.target_change_log FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "target_change_log_insert" ON public.target_change_log FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

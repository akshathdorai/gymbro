-- Migration 0004: Indexes for performance

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_log_user_date
  ON public.daily_log (user_id, log_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meals_user_date
  ON public.meals (user_id, log_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meals_user_type
  ON public.meals (user_id, meal_type, log_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_user_date
  ON public.workouts (user_id, workout_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sets_workout
  ON public.workout_sets (workout_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sets_exercise
  ON public.workout_sets (user_id, exercise, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weight_history_user_date
  ON public.weight_history (user_id, logged_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_user
  ON public.chat_messages (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weekly_checkin_user_week
  ON public.weekly_checkin (user_id, week_number DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_targets_user_active
  ON public.user_targets (user_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_photos_user_date
  ON public.progress_photos (user_id, taken_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_program_history_program
  ON public.program_history (program_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_target_change_log_user
  ON public.target_change_log (user_id, created_at DESC);

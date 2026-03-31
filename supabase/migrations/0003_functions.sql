-- Migration 0003: Database Functions & Triggers

-- ============================================================
-- Auto-provision user records on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profile (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_targets (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Get current active targets for a user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_targets(p_user_id UUID)
RETURNS SETOF public.user_targets
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.user_targets
  WHERE user_id = p_user_id AND is_active = TRUE
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- ============================================================
-- Upsert daily log (used by AI tool handler)
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_daily_log(
  p_user_id     UUID,
  p_date        DATE,
  p_steps       INT DEFAULT NULL,
  p_water_ml    INT DEFAULT NULL,
  p_sleep_hours NUMERIC DEFAULT NULL,
  p_stretching  BOOLEAN DEFAULT NULL,
  p_notes       TEXT DEFAULT NULL
)
RETURNS public.daily_log
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result public.daily_log;
BEGIN
  INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
  VALUES (p_user_id, p_date, p_steps, p_water_ml, p_sleep_hours, p_stretching, p_notes)
  ON CONFLICT (user_id, log_date)
  DO UPDATE SET
    steps           = COALESCE(EXCLUDED.steps, daily_log.steps),
    water_ml        = COALESCE(EXCLUDED.water_ml, daily_log.water_ml),
    sleep_hours     = COALESCE(EXCLUDED.sleep_hours, daily_log.sleep_hours),
    stretching_done = COALESCE(EXCLUDED.stretching_done, daily_log.stretching_done),
    notes           = COALESCE(EXCLUDED.notes, daily_log.notes),
    updated_at      = NOW()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- Weekly summary view (used by AI get_weekly_summary tool)
-- ============================================================
CREATE OR REPLACE VIEW public.weekly_summary AS
SELECT
  dl.user_id,
  date_trunc('week', dl.log_date)::DATE AS week_start,
  COUNT(*) AS days_logged,
  ROUND(AVG(dl.steps)) AS avg_steps,
  ROUND(AVG(dl.water_ml)) AS avg_water_ml,
  ROUND(AVG(dl.sleep_hours)::NUMERIC, 1) AS avg_sleep_hours,
  SUM(CASE WHEN dl.stretching_done THEN 1 ELSE 0 END) AS stretching_days,
  COUNT(DISTINCT w.id) AS workouts_done,
  ROUND(AVG(m_agg.total_calories)) AS avg_calories,
  ROUND(AVG(m_agg.total_protein)::NUMERIC, 1) AS avg_protein_g
FROM public.daily_log dl
LEFT JOIN public.workouts w ON w.user_id = dl.user_id AND w.workout_date = dl.log_date
LEFT JOIN (
  SELECT
    user_id,
    log_date,
    SUM(calories) AS total_calories,
    SUM(protein_g) AS total_protein
  FROM public.meals
  GROUP BY user_id, log_date
) m_agg ON m_agg.user_id = dl.user_id AND m_agg.log_date = dl.log_date
GROUP BY dl.user_id, date_trunc('week', dl.log_date);

-- ============================================================
-- Updated_at trigger function (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profile_updated_at
  BEFORE UPDATE ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER program_updated_at
  BEFORE UPDATE ON public.program
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER daily_log_updated_at
  BEFORE UPDATE ON public.daily_log
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

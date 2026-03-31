-- Migration 0001: Initial Schema
-- GymBro fitness coaching app

-- ============================================================
-- USER PROFILE
-- ============================================================
CREATE TABLE public.user_profile (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT,
  age                  INT,
  gender               TEXT,
  height_cm            NUMERIC,
  weight_start_kg      NUMERIC,
  weight_target_min_kg NUMERIC,
  weight_target_max_kg NUMERIC,
  injuries             TEXT,
  equipment            TEXT[],
  schedule_notes       TEXT,
  onboarding_complete  BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER TARGETS (dynamic, can be updated by AI)
-- ============================================================
CREATE TABLE public.user_targets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  effective_date      DATE DEFAULT CURRENT_DATE,
  calorie_target      INT DEFAULT 2000,
  protein_target_g    INT DEFAULT 150,
  carb_target_g       INT DEFAULT 200,
  fat_target_g        INT DEFAULT 65,
  step_target         INT DEFAULT 8000,
  water_ml_target     INT DEFAULT 2500,
  sleep_hours_target  NUMERIC DEFAULT 7.5,
  notes               TEXT,
  changed_by          TEXT DEFAULT 'user' CHECK (changed_by IN ('user', 'ai')),
  change_reason       TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY LOG (one row per user per day)
-- ============================================================
CREATE TABLE public.daily_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  steps           INT,
  water_ml        INT DEFAULT 0,
  sleep_hours     NUMERIC,
  stretching_done BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- ============================================================
-- MEALS
-- ============================================================
CREATE TABLE public.meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  meal_type   TEXT NOT NULL DEFAULT 'other' CHECK (meal_type IN ('breakfast','lunch','dinner','snack','other')),
  name        TEXT NOT NULL,
  description TEXT,
  photo_url   TEXT,
  calories    INT,
  protein_g   NUMERIC,
  carbs_g     NUMERIC,
  fat_g       NUMERIC,
  grams       NUMERIC,
  source      TEXT DEFAULT 'manual' CHECK (source IN ('manual','ai_photo','saved','usda')),
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVED MEALS
-- ============================================================
CREATE TABLE public.saved_meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  calories    INT,
  protein_g   NUMERIC,
  carbs_g     NUMERIC,
  fat_g       NUMERIC,
  grams       NUMERIC,
  use_count   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKOUTS (sessions)
-- ============================================================
CREATE TABLE public.workouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  name         TEXT,
  duration_sec INT,
  notes        TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKOUT SETS
-- ============================================================
CREATE TABLE public.workout_sets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id     UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise       TEXT NOT NULL,
  set_number     INT NOT NULL,
  weight_kg      NUMERIC,
  reps           INT,
  duration_sec   INT,
  rpe            NUMERIC,
  completed      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WEIGHT HISTORY
-- ============================================================
CREATE TABLE public.weight_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg   NUMERIC NOT NULL,
  body_fat_pct NUMERIC,
  logged_at   DATE NOT NULL,
  notes       TEXT,
  UNIQUE(user_id, logged_at)
);

-- ============================================================
-- WEEKLY CHECK-IN
-- ============================================================
CREATE TABLE public.weekly_checkin (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number      INT NOT NULL,
  week_start       DATE NOT NULL,
  weight_kg        NUMERIC,
  diet_rating      INT CHECK (diet_rating BETWEEN 1 AND 10),
  energy_rating    INT CHECK (energy_rating BETWEEN 1 AND 10),
  hardest          TEXT,
  went_well        TEXT,
  workouts_done    INT,
  workouts_target  INT,
  avg_steps        INT,
  avg_calories     INT,
  avg_protein_g    NUMERIC,
  avg_sleep_hours  NUMERIC,
  avg_water_ml     INT,
  ai_review        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

-- ============================================================
-- PROGRESS PHOTOS
-- ============================================================
CREATE TABLE public.progress_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  angle       TEXT CHECK (angle IN ('front','side','back')),
  taken_at    DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROGRAM (AI-generated workout program)
-- ============================================================
CREATE TABLE public.program (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_number  INT NOT NULL DEFAULT 1,
  week_number   INT NOT NULL DEFAULT 1,
  name          TEXT,
  structure     JSONB NOT NULL DEFAULT '{}',
  -- structure shape:
  -- {
  --   "days": [
  --     {
  --       "name": "Workout A — Push",
  --       "day_key": "A",
  --       "exercises": [
  --         {
  --           "name": "Dumbbell Bench Press",
  --           "sets": 3,
  --           "reps": "8-10",
  --           "target_weight_kg": 20,
  --           "rest_sec": 90,
  --           "form_cues": "...",
  --           "video_url": "..."
  --         }
  --       ]
  --     }
  --   ],
  --   "schedule": ["A","rest","B","rest","C","rest","rest"],
  --   "notes": "..."
  -- }
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active program per user
CREATE UNIQUE INDEX program_active_user ON public.program(user_id) WHERE is_active = TRUE;

-- ============================================================
-- PROGRAM HISTORY (version log of program changes)
-- ============================================================
CREATE TABLE public.program_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id  UUID NOT NULL REFERENCES public.program(id) ON DELETE CASCADE,
  change_type TEXT,
  old_data    JSONB,
  new_data    JSONB,
  changed_by  TEXT DEFAULT 'ai',
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE public.notification_preferences (
  user_id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_check_enabled     BOOLEAN DEFAULT TRUE,
  workout_reminder        BOOLEAN DEFAULT TRUE,
  water_reminder          BOOLEAN DEFAULT TRUE,
  bedtime_reminder        BOOLEAN DEFAULT TRUE,
  weekly_checkin_reminder BOOLEAN DEFAULT TRUE,
  streak_celebration      BOOLEAN DEFAULT TRUE,
  quiet_start             TIME DEFAULT '22:00',
  quiet_end               TIME DEFAULT '08:00',
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TARGET CHANGE LOG (audit trail)
-- ============================================================
CREATE TABLE public.target_change_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field      TEXT NOT NULL,
  old_value  TEXT,
  new_value  TEXT,
  changed_by TEXT DEFAULT 'ai',
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

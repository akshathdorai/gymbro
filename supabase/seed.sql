-- seed.sql: Pre-load Akshath's profile, program, and Week 1 data
-- Run AFTER creating the user account in Supabase Auth
-- Replace 'AKSHATH_USER_ID' with the actual auth.users UUID after signup

-- ============================================================
-- IMPORTANT: Replace this placeholder with the real UUID
-- ============================================================
DO $$
DECLARE
  uid UUID := 'AKSHATH_USER_ID';  -- Replace with actual user UUID
BEGIN

-- ============================================================
-- User Profile
-- ============================================================
INSERT INTO public.user_profile (
  id, display_name, age, gender, height_cm,
  weight_start_kg, weight_target_min_kg, weight_target_max_kg,
  injuries, equipment, schedule_notes, onboarding_complete
) VALUES (
  uid,
  'Akshath',
  36,
  'male',
  165,
  82.0,
  68.0,
  72.0,
  'ACL surgery history on both knees — slightly weaker knees. Avoid high-impact jumping, deep heavy squats. Can handle moderate lower body work with caution.',
  ARRAY['Adjustable dumbbells (wide range)', 'Flat/incline bench', 'Under-desk treadmill (walking only, max 6 km/h)', 'No pull-up bar'],
  'Works from home 10am–3:30pm. Kids pickup at 3:30pm. Two kids ages 4 and 1. Handles cooking. Flexible mornings. Best workout window: 9:30–11:30am or after kids bedtime (9pm+).',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  age = EXCLUDED.age,
  height_cm = EXCLUDED.height_cm,
  weight_start_kg = EXCLUDED.weight_start_kg,
  injuries = EXCLUDED.injuries,
  equipment = EXCLUDED.equipment,
  onboarding_complete = EXCLUDED.onboarding_complete;

-- ============================================================
-- User Targets (Phase 1 baseline)
-- ============================================================
INSERT INTO public.user_targets (
  user_id, effective_date,
  calorie_target, protein_target_g, carb_target_g, fat_target_g,
  step_target, water_ml_target, sleep_hours_target,
  notes, changed_by, change_reason, is_active
) VALUES (
  uid, '2026-03-23',
  1800, 135, 180, 55,
  8000, 2500, 7.5,
  'Phase 1 baseline. 1800 cal deficit for 0.5kg/week loss. 135g protein to preserve muscle.',
  'user', 'Initial onboarding targets', TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Weight History — Starting weight + Week 1 weigh-ins
-- ============================================================
INSERT INTO public.weight_history (user_id, weight_kg, logged_at, notes) VALUES
  (uid, 82.0, '2026-03-23', 'Starting weight — Week 1 Day 1'),
  (uid, 81.6, '2026-03-28', 'End of Week 1 weigh-in')
ON CONFLICT (user_id, logged_at) DO NOTHING;

-- ============================================================
-- Phase 1 Program
-- ============================================================
INSERT INTO public.program (
  user_id, phase_number, week_number, name, structure, is_active
) VALUES (
  uid, 1, 1,
  'Phase 1 — Foundation',
  '{
    "schedule": ["A", "rest", "B", "rest", "C", "rest", "rest"],
    "schedule_notes": "3 days/week. Flexible days. Aim for Mon/Wed/Fri or Tue/Thu/Sat.",
    "phase_notes": "Phase 1 Weeks 1-4: Build habits, establish baseline strength, perfect form. No ego lifting.",
    "days": [
      {
        "day_key": "A",
        "name": "Workout A — Push (Chest, Shoulders, Triceps)",
        "exercises": [
          {
            "name": "Dumbbell Bench Press",
            "sets": 3, "reps": "8-10", "target_weight_kg": 20, "rest_sec": 90,
            "form_cues": "Flat bench. Control the descent (2-3 seconds down). Full ROM — bar to chest height. Elbows at 45° to body, not flared. Squeeze at top but don't lock out fully.",
            "video_url": "https://www.youtube.com/watch?v=VmB1G1K7v94"
          },
          {
            "name": "Incline Dumbbell Press",
            "sets": 3, "reps": "10-12", "target_weight_kg": 16, "rest_sec": 90,
            "form_cues": "Bench at 30-45°. Targets upper chest. Keep shoulder blades retracted. Don't arch lower back excessively.",
            "video_url": "https://www.youtube.com/watch?v=8iPEnn-ltC8"
          },
          {
            "name": "Dumbbell Shoulder Press",
            "sets": 3, "reps": "10-12", "target_weight_kg": 14, "rest_sec": 75,
            "form_cues": "Seated or standing. Start at ear height. Press straight up, slight arc at top. Don't shrug traps. Control the lowering.",
            "video_url": "https://www.youtube.com/watch?v=qEwKCR5JCog"
          },
          {
            "name": "Dumbbell Lateral Raises",
            "sets": 3, "reps": "12-15", "target_weight_kg": 8, "rest_sec": 60,
            "form_cues": "Slight bend at elbow. Lead with elbows, not hands. Stop at shoulder height. Don't swing. These should burn.",
            "video_url": "https://www.youtube.com/watch?v=3VcKaXpzqRo"
          },
          {
            "name": "Dumbbell Tricep Overhead Extension",
            "sets": 3, "reps": "12-15", "target_weight_kg": 14, "rest_sec": 60,
            "form_cues": "Single dumbbell, both hands. Elbows tight to head. Full ROM — feel the stretch at bottom. Don't let elbows flare.",
            "video_url": "https://www.youtube.com/watch?v=nRiJVZDpdL0"
          },
          {
            "name": "Plank",
            "sets": 3, "reps": "30-45 sec", "target_weight_kg": 0, "rest_sec": 45, "is_timed": true,
            "form_cues": "Forearms down. Body straight as a board. Squeeze glutes and abs. Don't let hips sag or pike.",
            "video_url": "https://www.youtube.com/watch?v=pSHjTRCQxIw"
          }
        ]
      },
      {
        "day_key": "B",
        "name": "Workout B — Pull (Back, Biceps, Rear Delts)",
        "exercises": [
          {
            "name": "Dumbbell Romanian Deadlift",
            "sets": 3, "reps": "10-12", "target_weight_kg": 22, "rest_sec": 90,
            "form_cues": "Hinge at hips, not a squat. Slight knee bend. Push hips back. Feel hamstring stretch. Keep back flat — no rounding. Drive hips forward to stand. Knee-friendly alternative to barbell RDL.",
            "video_url": "https://www.youtube.com/watch?v=2SHsk9AzdjA"
          },
          {
            "name": "Dumbbell Bent-Over Row",
            "sets": 3, "reps": "10-12", "target_weight_kg": 20, "rest_sec": 90,
            "form_cues": "Hinge to 45° torso angle. Pull to hip, not chest. Lead with elbow. Squeeze lat at top. Don't jerk or use momentum. Both arms, or single-arm with support.",
            "video_url": "https://www.youtube.com/watch?v=6TSP1TRMUzs"
          },
          {
            "name": "Incline Dumbbell Row",
            "sets": 3, "reps": "12-15", "target_weight_kg": 16, "rest_sec": 75,
            "form_cues": "Chest on incline bench. Arms hanging down. Row to hips. Removes lower back from equation — good for fatigue.",
            "video_url": "https://www.youtube.com/watch?v=HTeKxnJT0ek"
          },
          {
            "name": "Dumbbell Face Pulls (Rear Delt Fly)",
            "sets": 3, "reps": "15", "target_weight_kg": 8, "rest_sec": 60,
            "form_cues": "Lying face down on incline bench. Pull elbows back and out. Squeeze rear delts. Light weight, high control.",
            "video_url": "https://www.youtube.com/watch?v=rep-qVOkqgk"
          },
          {
            "name": "Dumbbell Bicep Curl",
            "sets": 3, "reps": "12", "target_weight_kg": 12, "rest_sec": 60,
            "form_cues": "Alternate or both. Full ROM — all the way down, squeeze at top. Don't swing elbow forward. Supinate at top (rotate wrist out).",
            "video_url": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo"
          },
          {
            "name": "Dumbbell Hammer Curl",
            "sets": 2, "reps": "12", "target_weight_kg": 14, "rest_sec": 60,
            "form_cues": "Neutral grip (thumbs up). Heavier than regular curls. Targets brachialis and forearm.",
            "video_url": "https://www.youtube.com/watch?v=zC3nLlEvin4"
          }
        ]
      },
      {
        "day_key": "C",
        "name": "Workout C — Legs + Core",
        "exercises": [
          {
            "name": "Goblet Squat",
            "sets": 3, "reps": "12-15", "target_weight_kg": 16, "rest_sec": 90,
            "form_cues": "Hold dumbbell at chest. Feet shoulder-width, toes slightly out. Sit back and down. Keep chest tall. Go to parallel — NOT below (ACL). Drive through whole foot to stand.",
            "video_url": "https://www.youtube.com/watch?v=MeIiIdhvXT4"
          },
          {
            "name": "Dumbbell Reverse Lunge",
            "sets": 3, "reps": "10 each leg", "target_weight_kg": 14, "rest_sec": 75,
            "form_cues": "Step back, not forward (gentler on knees). Front knee over ankle. Back knee to just above floor. Keep torso upright. Drive through front heel to return.",
            "video_url": "https://www.youtube.com/watch?v=xrjPPgzIF2w"
          },
          {
            "name": "Dumbbell Romanian Deadlift",
            "sets": 3, "reps": "12", "target_weight_kg": 20, "rest_sec": 75,
            "form_cues": "Same as Workout B. Hamstring focus.",
            "video_url": "https://www.youtube.com/watch?v=2SHsk9AzdjA"
          },
          {
            "name": "Seated Calf Raise",
            "sets": 3, "reps": "15-20", "target_weight_kg": 20, "rest_sec": 60,
            "form_cues": "Dumbbell on thigh above knee. Full ROM — all the way up and all the way down. Slow lowering. Calves respond to volume.",
            "video_url": "https://www.youtube.com/watch?v=JbyjNymZOt0"
          },
          {
            "name": "Mountain Climbers",
            "sets": 3, "reps": "30 sec", "target_weight_kg": 0, "rest_sec": 45, "is_timed": true,
            "form_cues": "Plank position. Drive knees to chest alternating. Keep hips level. Moderate pace — control > speed.",
            "video_url": "https://www.youtube.com/watch?v=nmwgirgXLYM"
          },
          {
            "name": "Farmer''s Carry",
            "sets": 3, "reps": "30m or 30 sec", "target_weight_kg": 22, "rest_sec": 60, "is_timed": true,
            "form_cues": "Dumbbells at sides. Stand tall. Engage core. Walk with purpose. On treadmill at slow speed or pace the room.",
            "video_url": "https://www.youtube.com/watch?v=Fkzk_RqlYig"
          }
        ]
      }
    ],
    "daily_stretches": [
      {"name": "90/90 Hip Stretch", "duration_sec": 60, "notes": "30 sec each side. Crucial for desk workers and ACL knees."},
      {"name": "Couch Stretch", "duration_sec": 60, "notes": "30 sec each side. Hip flexor opener."},
      {"name": "Pigeon Pose / Figure-4 Stretch", "duration_sec": 60, "notes": "30 sec each side. Glutes and external rotators."}
    ]
  }'::JSONB,
  TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Week 1 Daily Logs (March 23–29, 2026)
-- ============================================================

-- Monday March 23 — Workout A day
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-23', 6200, 2000, 7.0, FALSE, 'Starting week 1. Did Workout A.')
ON CONFLICT (user_id, log_date) DO NOTHING;

-- Tuesday March 24 — Rest day
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done)
VALUES (uid, '2026-03-24', 4800, 1800, 7.5, TRUE)
ON CONFLICT (user_id, log_date) DO NOTHING;

-- Wednesday March 25 — Workout B day
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done)
VALUES (uid, '2026-03-25', 7100, 2200, 6.5, FALSE)
ON CONFLICT (user_id, log_date) DO NOTHING;

-- Thursday March 26 — Rest day
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done)
VALUES (uid, '2026-03-26', 5500, 2500, 8.0, TRUE)
ON CONFLICT (user_id, log_date) DO NOTHING;

-- Friday March 27 — Workout C day
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done)
VALUES (uid, '2026-03-27', 8800, 2300, 7.5, TRUE)
ON CONFLICT (user_id, log_date) DO NOTHING;

-- Saturday March 28 — Active rest / tennis
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-28', 10200, 3000, 7.0, FALSE, 'Tennis with friends. Good NEAT.')
ON CONFLICT (user_id, log_date) DO NOTHING;

-- Sunday March 29 — Rest day + check-in
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done)
VALUES (uid, '2026-03-29', 5200, 2100, 8.5, TRUE)
ON CONFLICT (user_id, log_date) DO NOTHING;

-- ============================================================
-- Week 1 Workouts
-- ============================================================

-- Workout A (March 23)
WITH w AS (
  INSERT INTO public.workouts (user_id, workout_date, name, duration_sec, notes)
  VALUES (uid, '2026-03-23', 'Workout A — Push', 2700, 'Felt good. First session. Weights conservative.')
  RETURNING id
)
INSERT INTO public.workout_sets (workout_id, user_id, exercise, set_number, weight_kg, reps, completed)
SELECT w.id, uid, exercise, set_number, weight_kg, reps, TRUE
FROM w,
(VALUES
  ('Dumbbell Bench Press', 1, 18, 10),
  ('Dumbbell Bench Press', 2, 18, 10),
  ('Dumbbell Bench Press', 3, 18, 9),
  ('Incline Dumbbell Press', 1, 14, 12),
  ('Incline Dumbbell Press', 2, 14, 12),
  ('Incline Dumbbell Press', 3, 14, 10),
  ('Dumbbell Shoulder Press', 1, 12, 12),
  ('Dumbbell Shoulder Press', 2, 12, 11),
  ('Dumbbell Shoulder Press', 3, 12, 10),
  ('Dumbbell Lateral Raises', 1, 6, 15),
  ('Dumbbell Lateral Raises', 2, 6, 15),
  ('Dumbbell Lateral Raises', 3, 6, 12),
  ('Dumbbell Tricep Overhead Extension', 1, 12, 15),
  ('Dumbbell Tricep Overhead Extension', 2, 12, 13),
  ('Dumbbell Tricep Overhead Extension', 3, 12, 12),
  ('Plank', 1, 0, 35),
  ('Plank', 2, 0, 30),
  ('Plank', 3, 0, 30)
) AS vals(exercise, set_number, weight_kg, reps)
ON CONFLICT DO NOTHING;

-- Workout B (March 25)
WITH w AS (
  INSERT INTO public.workouts (user_id, workout_date, name, duration_sec, notes)
  VALUES (uid, '2026-03-25', 'Workout B — Pull', 2880, 'Rows felt strong. Good pump.')
  RETURNING id
)
INSERT INTO public.workout_sets (workout_id, user_id, exercise, set_number, weight_kg, reps, completed)
SELECT w.id, uid, exercise, set_number, weight_kg, reps, TRUE
FROM w,
(VALUES
  ('Dumbbell Romanian Deadlift', 1, 20, 12),
  ('Dumbbell Romanian Deadlift', 2, 20, 12),
  ('Dumbbell Romanian Deadlift', 3, 20, 10),
  ('Dumbbell Bent-Over Row', 1, 18, 12),
  ('Dumbbell Bent-Over Row', 2, 18, 11),
  ('Dumbbell Bent-Over Row', 3, 18, 10),
  ('Incline Dumbbell Row', 1, 14, 15),
  ('Incline Dumbbell Row', 2, 14, 14),
  ('Incline Dumbbell Row', 3, 14, 12),
  ('Dumbbell Face Pulls (Rear Delt Fly)', 1, 6, 15),
  ('Dumbbell Face Pulls (Rear Delt Fly)', 2, 6, 15),
  ('Dumbbell Face Pulls (Rear Delt Fly)', 3, 6, 15),
  ('Dumbbell Bicep Curl', 1, 10, 12),
  ('Dumbbell Bicep Curl', 2, 10, 12),
  ('Dumbbell Bicep Curl', 3, 10, 11),
  ('Dumbbell Hammer Curl', 1, 12, 12),
  ('Dumbbell Hammer Curl', 2, 12, 10)
) AS vals(exercise, set_number, weight_kg, reps)
ON CONFLICT DO NOTHING;

-- Workout C (March 27)
WITH w AS (
  INSERT INTO public.workouts (user_id, workout_date, name, duration_sec, notes)
  VALUES (uid, '2026-03-27', 'Workout C — Legs + Core', 3000, 'Legs felt it. Goblet squat form is good.')
  RETURNING id
)
INSERT INTO public.workout_sets (workout_id, user_id, exercise, set_number, weight_kg, reps, completed)
SELECT w.id, uid, exercise, set_number, weight_kg, reps, TRUE
FROM w,
(VALUES
  ('Goblet Squat', 1, 14, 15),
  ('Goblet Squat', 2, 14, 15),
  ('Goblet Squat', 3, 14, 12),
  ('Dumbbell Reverse Lunge', 1, 12, 10),
  ('Dumbbell Reverse Lunge', 2, 12, 10),
  ('Dumbbell Reverse Lunge', 3, 12, 9),
  ('Dumbbell Romanian Deadlift', 1, 18, 12),
  ('Dumbbell Romanian Deadlift', 2, 18, 12),
  ('Dumbbell Romanian Deadlift', 3, 18, 12),
  ('Seated Calf Raise', 1, 18, 20),
  ('Seated Calf Raise', 2, 18, 18),
  ('Seated Calf Raise', 3, 18, 15),
  ('Mountain Climbers', 1, 0, 30),
  ('Mountain Climbers', 2, 0, 30),
  ('Mountain Climbers', 3, 0, 25),
  ('Farmer''s Carry', 1, 20, 30),
  ('Farmer''s Carry', 2, 20, 30),
  ('Farmer''s Carry', 3, 20, 30)
) AS vals(exercise, set_number, weight_kg, reps)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Week 1 Meals (sample days)
-- ============================================================
-- March 23 meals
INSERT INTO public.meals (user_id, log_date, meal_type, name, calories, protein_g, carbs_g, fat_g, source) VALUES
  (uid, '2026-03-23', 'lunch', 'Rice, dal, sabzi + curd', 650, 28, 95, 12, 'manual'),
  (uid, '2026-03-23', 'snack', 'Banana + mixed nuts (small)', 220, 5, 30, 10, 'manual'),
  (uid, '2026-03-23', 'dinner', 'Chappati x3 + palak paneer', 680, 30, 80, 22, 'manual')
ON CONFLICT DO NOTHING;

-- March 25 meals
INSERT INTO public.meals (user_id, log_date, meal_type, name, calories, protein_g, carbs_g, fat_g, source) VALUES
  (uid, '2026-03-25', 'lunch', 'Chicken rice bowl + salad', 700, 45, 75, 15, 'manual'),
  (uid, '2026-03-25', 'snack', 'Greek yogurt + berries', 180, 15, 20, 3, 'manual'),
  (uid, '2026-03-25', 'dinner', 'Dosa x2 + sambar + coconut chutney', 560, 15, 90, 12, 'manual')
ON CONFLICT DO NOTHING;

-- March 27 meals
INSERT INTO public.meals (user_id, log_date, meal_type, name, calories, protein_g, carbs_g, fat_g, source) VALUES
  (uid, '2026-03-27', 'lunch', 'Rajma chawal + salad', 720, 32, 110, 10, 'manual'),
  (uid, '2026-03-27', 'snack', 'Protein shake + banana', 280, 28, 35, 4, 'manual'),
  (uid, '2026-03-27', 'dinner', 'Thai green curry + rice', 750, 35, 85, 20, 'manual')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Week 1 Check-in
-- ============================================================
INSERT INTO public.weekly_checkin (
  user_id, week_number, week_start, weight_kg,
  diet_rating, energy_rating,
  hardest, went_well,
  workouts_done, workouts_target,
  avg_steps, avg_calories, avg_protein_g, avg_sleep_hours, avg_water_ml,
  ai_review
) VALUES (
  uid, 1, '2026-03-23', 81.6,
  7, 7,
  'Skipping breakfast — felt hungry mid-morning on workout days. Water target hard to hit.',
  'All 3 workouts completed. Form felt good especially on pulls. Stretching twice.',
  3, 3,
  6829, 1440, 33, 7.4, 2129,
  'Solid Week 1. All 3 workouts ticked — that''s the most important thing in Phase 1. 0.4kg down from a standing start, which is real progress.

Calories are coming in low (avg 1440 vs 1800 target). Don''t undereat — it kills muscle and tanks energy. Hit 1800 consistently. Protein is also low at 33g avg. You need 135g. Prioritize protein at every meal: eggs, dal, paneer, chicken, Greek yogurt, protein shake.

Water is at 85% of target — close. Get a 1L bottle and fill it 2.5x daily.

Week 2: same workouts, slightly heavier where possible. Focus on eating more, not less.'
)
ON CONFLICT (user_id, week_number) DO NOTHING;

END $$;

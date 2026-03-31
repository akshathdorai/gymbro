-- seed.sql: Akshath's real profile, program, and Week 1 data
-- UUID: 07e674a2-2568-457c-adee-427980a9db8c

DO $$
DECLARE
  uid UUID := '07e674a2-2568-457c-adee-427980a9db8c';
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
  'ACL surgeries on both knees - slightly weaker knees. Avoid high-impact jumping, deep heavy squats. Reverse lunges preferred over forward lunges. Pigeon stretch may need to be substituted with figure-4 stretch.',
  ARRAY['Adjustable dumbbells (wide range)', 'Flat/incline bench', 'Under-desk treadmill (walking only, max 6 km/h)'],
  'Work from home 10am-3:30pm. Kids pickup at 3:30pm. Two kids: Veera (4) and Inba (1). Best workout window during work hours. Tennis on Thursdays starting April 1.',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  age = EXCLUDED.age,
  height_cm = EXCLUDED.height_cm,
  weight_start_kg = EXCLUDED.weight_start_kg,
  weight_target_min_kg = EXCLUDED.weight_target_min_kg,
  weight_target_max_kg = EXCLUDED.weight_target_max_kg,
  injuries = EXCLUDED.injuries,
  equipment = EXCLUDED.equipment,
  schedule_notes = EXCLUDED.schedule_notes,
  onboarding_complete = EXCLUDED.onboarding_complete;

-- ============================================================
-- User Targets (Week 2 targets as of 2026-03-30)
-- ============================================================
UPDATE public.user_targets SET is_active = FALSE WHERE user_id = uid;

INSERT INTO public.user_targets (
  user_id, effective_date,
  calorie_target, protein_target_g, carb_target_g, fat_target_g,
  step_target, water_ml_target, sleep_hours_target,
  notes, changed_by, change_reason, is_active
) VALUES (
  uid, '2026-03-30',
  1800, 135, 160, 60,
  8000, 2500, 7.5,
  'Phase 1 Week 2 targets. 1800 cal deficit. 135g protein to preserve muscle. Hand portion method.',
  'user', 'Week 1 check-in adjustments', TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Weight History
-- ============================================================
INSERT INTO public.weight_history (user_id, weight_kg, logged_at, notes) VALUES
  (uid, 82.0, '2026-03-23', 'Starting weight - Day 0'),
  (uid, 81.0, '2026-03-29', 'Week 1 check-in - down 1kg')
ON CONFLICT (user_id, logged_at) DO NOTHING;

-- ============================================================
-- Week 1 Daily Logs (March 23-29)
-- ============================================================
INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-23', 4500, 1500, 7.5, FALSE, 'Day 0. Not fully on plan yet.')
ON CONFLICT (user_id, log_date) DO NOTHING;

INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-24', 9400, 2000, 7.0, FALSE, 'Workout A done. Clean eating, no snacking. Slight oats overshoot.')
ON CONFLICT (user_id, log_date) DO NOTHING;

INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-25', 6600, NULL, 6.75, FALSE, 'Rest day. On track, no snacking.')
ON CONFLICT (user_id, log_date) DO NOTHING;

INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-26', 7400, 2000, 7.5, FALSE, 'Rest day. On track. 2 Parle-G biscuits for sweet craving (~60 cal).')
ON CONFLICT (user_id, log_date) DO NOTHING;

INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-27', 8000, 2000, 6.5, FALSE, 'Workout B done. Mango protein smoothie snack (~300 cal). 3 cups Activia yogurt midnight snack (~240 cal).')
ON CONFLICT (user_id, log_date) DO NOTHING;

INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-28', 6500, NULL, 8.0, FALSE, 'Kids birthday party. Diet 3/10.')
ON CONFLICT (user_id, log_date) DO NOTHING;

INSERT INTO public.daily_log (user_id, log_date, steps, water_ml, sleep_hours, stretching_done, notes)
VALUES (uid, '2026-03-29', 3000, NULL, NULL, FALSE, 'Rest day. Diet 3/10. Low energy day.')
ON CONFLICT (user_id, log_date) DO NOTHING;

-- ============================================================
-- Week 1 Workouts (weights in kg, converted from lbs)
-- ============================================================

WITH w AS (
  INSERT INTO public.workouts (user_id, workout_date, name, duration_sec, notes)
  VALUES (uid, '2026-03-24', 'Workout A - Upper Body Push + Core', 1680, 'First workout back after months off. 2 PRs logged.')
  RETURNING id
)
INSERT INTO public.workout_sets (workout_id, user_id, exercise, set_number, weight_kg, reps, completed)
SELECT w.id, uid, exercise, set_number, weight_kg, reps, TRUE
FROM w,
(VALUES
  ('Dumbbell Bench Press', 1, 5.4, 12),
  ('Dumbbell Bench Press', 2, 5.4, 12),
  ('Dumbbell Bench Press', 3, 5.4, 12),
  ('Seated Dumbbell Shoulder Press', 1, 5.4, 12),
  ('Seated Dumbbell Shoulder Press', 2, 5.4, 12),
  ('Seated Dumbbell Shoulder Press', 3, 5.4, 12),
  ('Dumbbell Chest Flyes', 1, 5.4, 12),
  ('Dumbbell Chest Flyes', 2, 5.4, 12),
  ('Dumbbell Chest Flyes', 3, 5.4, 12),
  ('Lateral Raises', 1, 3.4, 10),
  ('Lateral Raises', 2, 3.4, 10),
  ('Lateral Raises', 3, 3.4, 10),
  ('Dead Bug', 1, 0, 10),
  ('Dead Bug', 2, 0, 10),
  ('Dead Bug', 3, 0, 10),
  ('Plank', 1, 0, 30),
  ('Plank', 2, 0, 30)
) AS vals(exercise, set_number, weight_kg, reps)
ON CONFLICT DO NOTHING;

WITH w AS (
  INSERT INTO public.workouts (user_id, workout_date, name, duration_sec, notes)
  VALUES (uid, '2026-03-27', 'Workout B - Lower Body + Mobility', 2100, 'First lower body session. Legs were wobbly after. 7 PRs logged. Full body soreness for 2 days.')
  RETURNING id
)
INSERT INTO public.workout_sets (workout_id, user_id, exercise, set_number, weight_kg, reps, completed)
SELECT w.id, uid, exercise, set_number, weight_kg, reps, TRUE
FROM w,
(VALUES
  ('Goblet Squat', 1, 6.8, 12),
  ('Goblet Squat', 2, 6.8, 12),
  ('Goblet Squat', 3, 6.8, 12),
  ('Dumbbell Romanian Deadlift', 1, 6.8, 12),
  ('Dumbbell Romanian Deadlift', 2, 6.8, 12),
  ('Dumbbell Romanian Deadlift', 3, 6.8, 12),
  ('Reverse Lunges', 1, 3.4, 10),
  ('Reverse Lunges', 2, 3.4, 10),
  ('Reverse Lunges', 3, 3.4, 10),
  ('Standing Calf Raise', 1, 6.8, 15),
  ('Standing Calf Raise', 2, 6.8, 15),
  ('Standing Calf Raise', 3, 6.8, 15),
  ('90/90 Hip Stretch', 1, 0, 30),
  ('90/90 Hip Stretch', 2, 0, 30),
  ('Couch Stretch', 1, 0, 30),
  ('Couch Stretch', 2, 0, 30),
  ('Pigeon Stretch', 1, 0, 30),
  ('Pigeon Stretch', 2, 0, 30)
) AS vals(exercise, set_number, weight_kg, reps)
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
  uid, 1, '2026-03-23', 81.0,
  6, 6,
  'Creating a routine especially on weekends. Sticking to diet on weekends. Balancing with work.',
  'Weekdays mostly went according to plan. Diet on weekdays was strong. Steps trended up throughout the week.',
  2, 3,
  6486, 0, 0, 7.2, 1833,
  'Solid Week 1 for a restart. Down 1kg from a standing start - that is real. Two workouts done, and from what you described the form and effort were there. The third workout got away from you but we have already fixed that by moving everything to Mon/Tue/Wed.

The weekday diet being strong is the foundation. The weekend is where it fell apart - birthday party, low energy Sunday. One free meal per weekend, not two free days. That is the rule going into Week 2.

Key adjustments: all 3 workouts moved to Mon/Tue/Wed, weights increased across the board, weekend diet rule locked in.

Week 2 focus: get all 3 workouts done by Wednesday, hit protein at every meal, treat the weekend like a weekday except for one free meal.'
)
ON CONFLICT (user_id, week_number) DO NOTHING;

END $$;

-- ============================================================
-- Phase 1 Program (separate - dollar quoting handles special chars)
-- ============================================================
DELETE FROM public.program WHERE user_id = '07e674a2-2568-457c-adee-427980a9db8c';

INSERT INTO public.program (user_id, phase_number, week_number, name, structure, is_active)
VALUES (
  '07e674a2-2568-457c-adee-427980a9db8c',
  1, 2,
  'Phase 1 - Foundation',
  $json${
    "schedule": ["A", "B", "C", "rest", "rest", "rest", "rest"],
    "schedule_notes": "3 days/week. Mon/Tue/Wed during work hours. Rest Thu-Sun.",
    "phase_notes": "Phase 1: Build habits, establish baseline strength, perfect form. No ego lifting. Tennis on Thursdays starting April 1.",
    "days": [
      {
        "day_key": "A",
        "name": "Workout A - Upper Body Push + Core",
        "warmup": "3 min treadmill walk + 3x5 push-ups + arm circles",
        "exercises": [
          {
            "name": "Dumbbell Bench Press",
            "sets": 3, "reps": "12", "target_weight_kg": 6.8, "rest_sec": 60,
            "form_cues": "Lie flat on bench, feet on floor. Press dumbbells up from chest level. Lower slowly 2-3 seconds. Don't bounce at bottom.",
            "video_url": "https://www.youtube.com/watch?v=VmB1G1K7v94"
          },
          {
            "name": "Seated Dumbbell Shoulder Press",
            "sets": 3, "reps": "12", "target_weight_kg": 6.8, "rest_sec": 60,
            "form_cues": "Sit upright on bench. Dumbbells at shoulder height, palms forward. Press overhead. Don't lock elbows. Keep core tight, don't arch lower back.",
            "video_url": "https://www.youtube.com/watch?v=qEwKCR5JCog"
          },
          {
            "name": "Dumbbell Chest Flyes",
            "sets": 3, "reps": "12", "target_weight_kg": 5.4, "rest_sec": 45,
            "form_cues": "Lie flat on bench. Arms extended with slight elbow bend. Open arms wide. Go light - focus on stretch, not weight.",
            "video_url": "https://www.youtube.com/watch?v=8iPEnn-ltC8"
          },
          {
            "name": "Lateral Raises",
            "sets": 3, "reps": "10-15", "target_weight_kg": 4.5, "rest_sec": 45,
            "form_cues": "Standing, dumbbells at sides. Raise arms to shoulder height - no higher. Lead with elbows. Slow on the way down. No swinging.",
            "video_url": "https://www.youtube.com/watch?v=3VcKaXpzqRo"
          },
          {
            "name": "Dead Bug",
            "sets": 3, "reps": "10 each side", "target_weight_kg": 0, "rest_sec": 30,
            "form_cues": "Lie on back, arms up, knees at 90 degrees. Extend opposite arm and leg simultaneously. Keep lower back pressed into floor. Slow and controlled.",
            "video_url": "https://www.youtube.com/watch?v=g_BYB0R-4Ws"
          },
          {
            "name": "Plank",
            "sets": 3, "reps": "30s hold", "target_weight_kg": 0, "rest_sec": 30, "is_timed": true,
            "form_cues": "Forearms on floor, straight line head to heels. Squeeze glutes, tighten core, breathe normally. Don't sag or pike.",
            "video_url": "https://www.youtube.com/watch?v=pSHjTRCQxIw"
          }
        ]
      },
      {
        "day_key": "B",
        "name": "Workout B - Lower Body + Mobility",
        "warmup": "3 min treadmill walk + 10 bodyweight squats + hip circles",
        "exercises": [
          {
            "name": "Goblet Squat",
            "sets": 3, "reps": "12", "target_weight_kg": 9.0, "rest_sec": 60,
            "form_cues": "Hold single dumbbell vertically at chest. Squat to roughly parallel - don't force depth with knee history. Push through heels. Chest up.",
            "video_url": "https://www.youtube.com/watch?v=MeIiIdhvXT4"
          },
          {
            "name": "Dumbbell Romanian Deadlift",
            "sets": 3, "reps": "12", "target_weight_kg": 8.0, "rest_sec": 60,
            "form_cues": "Hinge at hips, push butt back. Slight knee bend but knees don't move. Dumbbells slide down front of legs. Stop at mid-shin. Squeeze glutes to stand.",
            "video_url": "https://www.youtube.com/watch?v=2SHsk9AzdjA"
          },
          {
            "name": "Reverse Lunges",
            "sets": 3, "reps": "10 each leg", "target_weight_kg": 4.5, "rest_sec": 60,
            "form_cues": "Step backward, lower until back knee nearly touches floor. Push through front heel. Easier on knees than forward lunges.",
            "video_url": "https://www.youtube.com/watch?v=xrjPPgzIF2w"
          },
          {
            "name": "Dumbbell Calf Raises",
            "sets": 3, "reps": "15", "target_weight_kg": 6.8, "rest_sec": 30,
            "form_cues": "Hold dumbbells at sides. Rise on toes, hold 1 second at top, lower slowly (3 seconds down).",
            "video_url": "https://www.youtube.com/watch?v=JbyjNymZOt0"
          },
          {
            "name": "90/90 Hip Stretch",
            "sets": 2, "reps": "30s each side", "target_weight_kg": 0, "rest_sec": 0, "is_timed": true,
            "form_cues": "Sit on floor, front leg 90 degrees in front, back leg 90 degrees behind. Sit tall, lean gently over front knee."
          },
          {
            "name": "Couch Stretch",
            "sets": 2, "reps": "30s each side", "target_weight_kg": 0, "rest_sec": 0, "is_timed": true,
            "form_cues": "Kneel with one knee on floor, foot resting against wall behind. Other foot flat in front. Push hips forward. Squeeze glute on back leg."
          },
          {
            "name": "Pigeon Stretch",
            "sets": 2, "reps": "30s each side", "target_weight_kg": 0, "rest_sec": 0, "is_timed": true,
            "form_cues": "From all fours, bring one knee forward, lay shin across body. Lower torso. If knees feel uncomfortable, substitute with figure-4 stretch on back."
          }
        ]
      },
      {
        "day_key": "C",
        "name": "Workout C - Upper Body Pull + Conditioning",
        "warmup": "3 min treadmill walk + arm circles + cat-cow (10 reps)",
        "exercises": [
          {
            "name": "Dumbbell Bent-Over Rows",
            "sets": 3, "reps": "10-12", "target_weight_kg": 5.4, "rest_sec": 60,
            "form_cues": "Hinge forward 45 degrees. Pull dumbbells to hips. Squeeze shoulder blades together at top.",
            "video_url": "https://www.youtube.com/watch?v=6TSP1TRMUzs"
          },
          {
            "name": "Single-Arm Dumbbell Row",
            "sets": 3, "reps": "10 each arm", "target_weight_kg": 5.4, "rest_sec": 60,
            "form_cues": "One knee and hand on bench. Row with other arm. Pull to hip, squeeze at top.",
            "video_url": "https://www.youtube.com/watch?v=HTeKxnJT0ek"
          },
          {
            "name": "Dumbbell Pullovers",
            "sets": 3, "reps": "12", "target_weight_kg": 6.8, "rest_sec": 60,
            "form_cues": "Lie on bench, hold single dumbbell over chest with both hands. Lower behind head in arc. Pull back up.",
            "video_url": "https://www.youtube.com/watch?v=JbyjNymZOt0"
          },
          {
            "name": "Bicep Curls",
            "sets": 2, "reps": "12", "target_weight_kg": 4.5, "rest_sec": 45,
            "form_cues": "No swinging. Controlled up and down.",
            "video_url": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo"
          },
          {
            "name": "Hammer Curls",
            "sets": 2, "reps": "12", "target_weight_kg": 4.5, "rest_sec": 45,
            "form_cues": "Same as curls but palms face each other. Works forearms and biceps.",
            "video_url": "https://www.youtube.com/watch?v=zC3nLlEvin4"
          },
          {
            "name": "Farmers Carry",
            "sets": 3, "reps": "30-40s", "target_weight_kg": 11.3, "rest_sec": 45, "is_timed": true,
            "form_cues": "Heaviest dumbbells you can hold. Walk around. Squeeze grip, shoulders back and down, core tight.",
            "video_url": "https://www.youtube.com/watch?v=Fkzk_RqlYig"
          },
          {
            "name": "Mountain Climbers",
            "sets": 3, "reps": "20s", "target_weight_kg": 0, "rest_sec": 30, "is_timed": true,
            "form_cues": "Controlled pace. Don't rush. Heart rate should spike.",
            "video_url": "https://www.youtube.com/watch?v=nmwgirgXLYM"
          }
        ]
      }
    ],
    "daily_stretches": [
      {"name": "90/90 Hip Stretch", "duration_sec": 60, "notes": "30 sec each side. Crucial for desk workers and ACL knees."},
      {"name": "Couch Stretch", "duration_sec": 60, "notes": "30 sec each side. Hip flexor opener."},
      {"name": "Figure-4 Stretch", "duration_sec": 60, "notes": "30 sec each side. Safer for knees than pigeon."}
    ]
  }$json$::JSONB,
  TRUE
)
ON CONFLICT DO NOTHING;

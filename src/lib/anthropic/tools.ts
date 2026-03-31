import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const coachTools: Tool[] = [
  {
    name: "get_todays_log",
    description:
      "Returns today's daily log: steps, water, sleep, stretching status, all meals logged today (with macros), and whether a workout was completed today.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_weekly_summary",
    description:
      "Returns aggregated weekly data for a given week. Includes average steps, water, sleep, calories, protein, workouts completed, and stretching days.",
    input_schema: {
      type: "object" as const,
      properties: {
        week_offset: {
          type: "number",
          description:
            "0 = current week, -1 = last week, -2 = two weeks ago. Default 0.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_current_program",
    description:
      "Returns the user's current active workout program including all exercises, sets, reps, target weights, form cues, and the weekly schedule.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_weight_history",
    description:
      "Returns the user's weight history (all weigh-ins with dates). Use to identify trends, stalls, or progress toward target weight.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Max entries to return. Default 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_user_profile",
    description:
      "Returns the user's full profile: age, height, current targets, injuries, equipment, schedule, goals, and current phase/week number.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "log_daily_entry",
    description:
      "Logs or updates a daily entry on behalf of the user directly from conversation. Can log steps, water, sleep, stretching, or a meal.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["steps", "water", "sleep", "stretching", "meal"],
          description: "Type of entry to log.",
        },
        date: {
          type: "string",
          description: "ISO date string YYYY-MM-DD. Defaults to today.",
        },
        steps: { type: "number", description: "Step count (if type=steps)" },
        water_ml: {
          type: "number",
          description: "Water in ml (if type=water)",
        },
        sleep_hours: {
          type: "number",
          description: "Hours of sleep (if type=sleep)",
        },
        stretching_done: {
          type: "boolean",
          description: "Whether stretching was done (if type=stretching)",
        },
        meal: {
          type: "object",
          description: "Meal details (if type=meal)",
          properties: {
            meal_type: {
              type: "string",
              enum: ["breakfast", "lunch", "dinner", "snack", "other"],
            },
            name: { type: "string" },
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
          },
          required: ["name", "meal_type"],
        },
      },
      required: ["type"],
    },
  },
  {
    name: "update_program",
    description:
      "Modifies the user's workout program. Use to adjust exercise weights, swap exercises, change sets/reps, or update the program structure after weekly check-ins.",
    input_schema: {
      type: "object" as const,
      properties: {
        changes: {
          type: "array",
          description: "List of changes to apply to the program.",
          items: {
            type: "object",
            properties: {
              day_key: {
                type: "string",
                description: "Which workout day to modify: A, B, or C",
              },
              exercise_name: {
                type: "string",
                description: "Exact exercise name as it appears in the program",
              },
              field: {
                type: "string",
                enum: [
                  "target_weight_kg",
                  "sets",
                  "reps",
                  "rest_sec",
                  "form_cues",
                ],
                description: "Which field to update",
              },
              value: {
                description:
                  "New value for the field (number for weights/sets/reps, string for form_cues)",
              },
            },
            required: ["day_key", "exercise_name", "field", "value"],
          },
        },
        reason: {
          type: "string",
          description: "Why this change is being made (shown in version history)",
        },
        week_number: {
          type: "number",
          description: "New week number if advancing the program week",
        },
        phase_number: {
          type: "number",
          description: "New phase number if transitioning phases",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "update_targets",
    description:
      "Updates the user's daily targets (calories, protein, steps, water, sleep). Use when recommending target adjustments based on progress.",
    input_schema: {
      type: "object" as const,
      properties: {
        calorie_target: { type: "number" },
        protein_target_g: { type: "number" },
        carb_target_g: { type: "number" },
        fat_target_g: { type: "number" },
        step_target: { type: "number" },
        water_ml_target: { type: "number" },
        sleep_hours_target: { type: "number" },
        reason: {
          type: "string",
          description: "Why targets are being changed. Required.",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "get_progress_summary",
    description:
      "Returns an overall progress summary: starting weight, current weight, weight lost, weeks elapsed, workout adherence rate, and trend direction.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

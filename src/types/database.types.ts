export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string
          display_name: string | null
          age: number | null
          gender: string | null
          height_cm: number | null
          weight_start_kg: number | null
          weight_target_min_kg: number | null
          weight_target_max_kg: number | null
          injuries: string | null
          equipment: string[] | null
          schedule_notes: string | null
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          age?: number | null
          gender?: string | null
          height_cm?: number | null
          weight_start_kg?: number | null
          weight_target_min_kg?: number | null
          weight_target_max_kg?: number | null
          injuries?: string | null
          equipment?: string[] | null
          schedule_notes?: string | null
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          age?: number | null
          gender?: string | null
          height_cm?: number | null
          weight_start_kg?: number | null
          weight_target_min_kg?: number | null
          weight_target_max_kg?: number | null
          injuries?: string | null
          equipment?: string[] | null
          schedule_notes?: string | null
          onboarding_complete?: boolean
          updated_at?: string
        }
      }
      user_targets: {
        Row: {
          id: string
          user_id: string
          effective_date: string
          calorie_target: number | null
          protein_target_g: number | null
          carb_target_g: number | null
          fat_target_g: number | null
          step_target: number | null
          water_ml_target: number | null
          sleep_hours_target: number | null
          notes: string | null
          changed_by: string | null
          change_reason: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          effective_date?: string
          calorie_target?: number | null
          protein_target_g?: number | null
          carb_target_g?: number | null
          fat_target_g?: number | null
          step_target?: number | null
          water_ml_target?: number | null
          sleep_hours_target?: number | null
          notes?: string | null
          changed_by?: string | null
          change_reason?: string | null
          is_active?: boolean
        }
        Update: {
          calorie_target?: number | null
          protein_target_g?: number | null
          carb_target_g?: number | null
          fat_target_g?: number | null
          step_target?: number | null
          water_ml_target?: number | null
          sleep_hours_target?: number | null
          notes?: string | null
          is_active?: boolean
        }
      }
      daily_log: {
        Row: {
          id: string
          user_id: string
          log_date: string
          steps: number | null
          water_ml: number | null
          sleep_hours: number | null
          stretching_done: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          steps?: number | null
          water_ml?: number | null
          sleep_hours?: number | null
          stretching_done?: boolean
          notes?: string | null
        }
        Update: {
          steps?: number | null
          water_ml?: number | null
          sleep_hours?: number | null
          stretching_done?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
          name: string
          description: string | null
          photo_url: string | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          grams: number | null
          source: 'manual' | 'ai_photo' | 'saved' | 'usda'
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
          name: string
          description?: string | null
          photo_url?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          grams?: number | null
          source?: 'manual' | 'ai_photo' | 'saved' | 'usda'
        }
        Update: {
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
          name?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
        }
      }
      saved_meals: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          grams: number | null
          use_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          grams?: number | null
          use_count?: number
        }
        Update: {
          name?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          use_count?: number
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          workout_date: string
          name: string | null
          duration_sec: number | null
          notes: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_date: string
          name?: string | null
          duration_sec?: number | null
          notes?: string | null
        }
        Update: {
          name?: string | null
          duration_sec?: number | null
          notes?: string | null
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          exercise: string
          set_number: number
          weight_kg: number | null
          reps: number | null
          duration_sec: number | null
          rpe: number | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          exercise: string
          set_number: number
          weight_kg?: number | null
          reps?: number | null
          duration_sec?: number | null
          rpe?: number | null
          completed?: boolean
        }
        Update: {
          weight_kg?: number | null
          reps?: number | null
          duration_sec?: number | null
          completed?: boolean
        }
      }
      weight_history: {
        Row: {
          id: string
          user_id: string
          weight_kg: number
          body_fat_pct: number | null
          logged_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          weight_kg: number
          body_fat_pct?: number | null
          logged_at: string
          notes?: string | null
        }
        Update: {
          weight_kg?: number
          body_fat_pct?: number | null
          notes?: string | null
        }
      }
      weekly_checkin: {
        Row: {
          id: string
          user_id: string
          week_number: number
          week_start: string
          weight_kg: number | null
          diet_rating: number | null
          energy_rating: number | null
          hardest: string | null
          went_well: string | null
          workouts_done: number | null
          workouts_target: number | null
          avg_steps: number | null
          avg_calories: number | null
          avg_protein_g: number | null
          avg_sleep_hours: number | null
          avg_water_ml: number | null
          ai_review: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          week_start: string
          weight_kg?: number | null
          diet_rating?: number | null
          energy_rating?: number | null
          hardest?: string | null
          went_well?: string | null
          workouts_done?: number | null
          workouts_target?: number | null
          avg_steps?: number | null
          avg_calories?: number | null
          avg_protein_g?: number | null
          avg_sleep_hours?: number | null
          avg_water_ml?: number | null
          ai_review?: string | null
        }
        Update: {
          weight_kg?: number | null
          diet_rating?: number | null
          energy_rating?: number | null
          hardest?: string | null
          went_well?: string | null
          ai_review?: string | null
        }
      }
      progress_photos: {
        Row: {
          id: string
          user_id: string
          storage_key: string
          angle: 'front' | 'side' | 'back' | null
          taken_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_key: string
          angle?: 'front' | 'side' | 'back' | null
          taken_at: string
          notes?: string | null
        }
        Update: {
          notes?: string | null
        }
      }
      program: {
        Row: {
          id: string
          user_id: string
          phase_number: number
          week_number: number
          name: string | null
          structure: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phase_number?: number
          week_number?: number
          name?: string | null
          structure?: Json
          is_active?: boolean
        }
        Update: {
          phase_number?: number
          week_number?: number
          name?: string | null
          structure?: Json
          is_active?: boolean
          updated_at?: string
        }
      }
      program_history: {
        Row: {
          id: string
          user_id: string
          program_id: string
          change_type: string | null
          old_data: Json | null
          new_data: Json | null
          changed_by: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          change_type?: string | null
          old_data?: Json | null
          new_data?: Json | null
          changed_by?: string | null
          reason?: string | null
        }
        Update: Record<string, never>
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string | null
          tool_calls: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant'
          content?: string | null
          tool_calls?: Json | null
        }
        Update: Record<string, never>
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth_key: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth_key: string
          user_agent?: string | null
        }
        Update: Record<string, never>
      }
      notification_preferences: {
        Row: {
          user_id: string
          daily_check_enabled: boolean
          workout_reminder: boolean
          water_reminder: boolean
          bedtime_reminder: boolean
          weekly_checkin_reminder: boolean
          streak_celebration: boolean
          quiet_start: string
          quiet_end: string
          updated_at: string
        }
        Insert: {
          user_id: string
          daily_check_enabled?: boolean
          workout_reminder?: boolean
          water_reminder?: boolean
          bedtime_reminder?: boolean
          weekly_checkin_reminder?: boolean
          streak_celebration?: boolean
          quiet_start?: string
          quiet_end?: string
        }
        Update: {
          daily_check_enabled?: boolean
          workout_reminder?: boolean
          water_reminder?: boolean
          bedtime_reminder?: boolean
          weekly_checkin_reminder?: boolean
          streak_celebration?: boolean
          quiet_start?: string
          quiet_end?: string
          updated_at?: string
        }
      }
      target_change_log: {
        Row: {
          id: string
          user_id: string
          field: string
          old_value: string | null
          new_value: string | null
          changed_by: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          field: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          reason?: string | null
        }
        Update: Record<string, never>
      }
    }
    Views: {
      weekly_summary: {
        Row: {
          user_id: string
          week_start: string
          days_logged: number
          avg_steps: number | null
          avg_water_ml: number | null
          avg_sleep_hours: number | null
          stretching_days: number | null
          workouts_done: number | null
          avg_calories: number | null
          avg_protein_g: number | null
        }
      }
    }
    Functions: {
      upsert_daily_log: {
        Args: {
          p_user_id: string
          p_date: string
          p_steps?: number | null
          p_water_ml?: number | null
          p_sleep_hours?: number | null
          p_stretching?: boolean | null
          p_notes?: string | null
        }
        Returns: Database['public']['Tables']['daily_log']['Row']
      }
    }
  }
}

// Convenience type aliases
export type UserProfile = Database['public']['Tables']['user_profile']['Row']
export type UserTargets = Database['public']['Tables']['user_targets']['Row']
export type DailyLog = Database['public']['Tables']['daily_log']['Row']
export type Meal = Database['public']['Tables']['meals']['Row']
export type SavedMeal = Database['public']['Tables']['saved_meals']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']
export type WeightHistory = Database['public']['Tables']['weight_history']['Row']
export type WeeklyCheckin = Database['public']['Tables']['weekly_checkin']['Row']
export type ProgressPhoto = Database['public']['Tables']['progress_photos']['Row']
export type Program = Database['public']['Tables']['program']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

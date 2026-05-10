export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  current_weight: number | null
  goal_weight: number | null
  body_fat_percentage: number | null
  goal_description: string | null
  challenge_start_date: string | null
  challenge_end_date: string | null
  tdee: number | null
  created_at: string
}

export interface CardioSession {
  type: string
  duration: number
  calories_burned: number
}

export interface WorkoutData {
  types: string[]
  exercises_count?: number | null
  duration_minutes?: number | null
  estimated_calories_burned?: number | null
  cardio_sessions?: CardioSession[]
  // legacy single-session fields (keep for backward compat)
  cardio_type?: string | null
  cardio_duration?: number | null
}

export interface DailyLog {
  id: string
  user_id: string
  log_date: string
  calories_consumed: number
  calories_burned: number
  steps: number
  water_ml: number
  workout_completed: boolean
  workout_data: WorkoutData | null
  meals: string | null
  supplements_taken: boolean
  supplement_list: string[]
  notes: string | null
  weight_kg: number | null
  body_fat_percentage: number | null
  muscle_mass_kg: number | null
  created_at: string
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  updated_at: string
}

export interface DayCompliance {
  date: string
  score: number
  color: 'green' | 'yellow' | 'red' | 'none'
  log: DailyLog | null
}

export interface CompetitionData {
  profile: Profile
  streak: Streak | null
  weeklyCompliance: number
  greenDays: number
  yellowDays: number
  redDays: number
  totalLoggedDays: number
  recentLogs: DailyLog[]
}

export const CHALLENGE_CRITERIA = {
  stepsGoal: 10000,
  waterGoal: 3000,
  calorieDeficit: 500,
  gymDaysPerWeek: { min: 4, max: 5 },
  cardioDaysPerWeek: { min: 5, max: 7 },
  challengeDurationMonths: 4,
}

export const WORKOUT_TYPES = [
  { id: 'chest',     label: 'صدر',    emoji: '💪' },
  { id: 'back',      label: 'ظهر',    emoji: '🔙' },
  { id: 'core',      label: 'معدة',   emoji: '🔥' },
  { id: 'triceps',   label: 'تراي',   emoji: '💥' },
  { id: 'biceps',    label: 'باي',    emoji: '🦾' },
  { id: 'shoulders', label: 'أكتاف',  emoji: '🏋️' },
  { id: 'legs',      label: 'رجلين',  emoji: '🦵' },
  { id: 'glutes',    label: 'مؤخرة',  emoji: '🍑' },
  { id: 'rest',      label: 'راحة',   emoji: '😴' },
]

export const CARDIO_TYPES = [
  'جري 🏃',
  'مشي سريع 🚶',
  'دراجة 🚴',
  'سباحة 🏊',
  'حبل قفز 🪢',
  'إليبتيكال ♾️',
  'HIIT ⚡',
  'تسلق درج 🪜',
]

export const SUPPLEMENTS = [
  'Creatine 🔴',
  'Whey Protein 🥛',
  'Multivitamin 💊',
  'Omega-3 🐟',
  'Vitamin D ☀️',
  'Pre-Workout 🔥',
  'BCAA 💪',
  'Calcium 🦴',
  'Zinc ⚡',
]

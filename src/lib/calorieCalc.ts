import { CARDIO_TYPES } from '@/types'

// MET values per cardio type — keys match CARDIO_TYPES strings exactly
export const CARDIO_METS: Record<string, number> = {
  'جري 🏃':        9.8,
  'مشي سريع 🚶':   4.5,
  'دراجة 🚴':      7.5,
  'سباحة 🏊':      7.0,
  'حبل قفز 🪢':    10.0,
  'إليبتيكال ♾️':  6.0,
  'HIIT ⚡':        8.0,
  'تسلق درج 🪜':   8.0,
}

// Verify at module load that all CARDIO_TYPES have a matching MET value
if (process.env.NODE_ENV === 'development') {
  CARDIO_TYPES.forEach((t) => {
    if (!(t in CARDIO_METS)) console.warn(`[calorieCalc] Missing MET for cardio type: "${t}"`)
  })
}

// MET = 5 for moderate resistance training
export function estimateWeightCalories(weightKg: number, durationMinutes: number): number {
  if (durationMinutes <= 0 || weightKg <= 0) return 0
  return Math.round(5 * weightKg * (durationMinutes / 60))
}

export function estimateCardioCalories(type: string, durationMinutes: number, weightKg: number): number {
  if (durationMinutes <= 0 || weightKg <= 0) return 0
  const MET = CARDIO_METS[type] ?? 5
  return Math.round(MET * weightKg * (durationMinutes / 60))
}

import { differenceInDays } from 'date-fns'
import { DailyLog, DayCompliance, CHALLENGE_CRITERIA, Profile } from '@/types'

export function calcDayScore(log: DailyLog): number {
  const criteria = [
    (log.calories_consumed || 0) > 0,
    (log.water_ml || 0) >= CHALLENGE_CRITERIA.waterGoal,
    (log.steps || 0) >= CHALLENGE_CRITERIA.stepsGoal,
    log.workout_completed,
    log.supplements_taken,
  ]
  const met = criteria.filter(Boolean).length
  return Math.round((met / criteria.length) * 100)
}

export function scoreToColor(score: number): 'green' | 'yellow' | 'red' | 'none' {
  if (score >= 80) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

export function buildCalendar(logs: DailyLog[], startDate: string): DayCompliance[] {
  const logMap = new Map(logs.map((l) => [l.log_date, l]))
  const start = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: DayCompliance[] = []
  const current = new Date(start)

  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0]
    const log = logMap.get(dateStr) || null
    const score = log ? calcDayScore(log) : 0
    days.push({
      date: dateStr,
      score,
      color: log ? scoreToColor(score) : 'none',
      log,
    })
    current.setDate(current.getDate() + 1)
  }

  return days
}

export function getWeeklyWorkoutCount(logs: DailyLog[]): { gym: number; cardio: number } {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recent = logs.filter((l) => new Date(l.log_date) >= weekAgo)
  return {
    gym: recent.filter((l) => l.workout_completed).length,
    cardio: recent.filter((l) => (l.workout_data?.cardio_sessions?.length ?? 0) > 0).length,
  }
}

// ─── Smart Prediction ───────────────────────────────────────────────────────

export interface SmartProjection {
  label: string
  days: number
  projectedWeight: number
  weightLoss: number
}

export interface SmartPredictResult {
  onTrack: boolean
  avgDailyDeficit: number
  avgCompliance: number
  projections: SmartProjection[]
}

export function smartPredict(logs: DailyLog[], profile: Profile): SmartPredictResult | null {
  const currentWeight = profile.current_weight
  const goalWeight = profile.goal_weight
  const tdee = profile.tdee

  if (!currentWeight || !goalWeight || !tdee) return null

  // Only use days where calories were actually logged
  const logsWithData = logs.filter((l) => (l.calories_consumed || 0) > 0)
  if (logsWithData.length === 0) return null

  const avgDailyDeficit =
    logsWithData.reduce((sum, l) => {
      const burned = l.calories_burned || 0
      return sum + (tdee - l.calories_consumed + burned)
    }, 0) / logsWithData.length

  // Cap at a sane range: -300 (slight surplus) to 1500 (aggressive deficit)
  const cappedDeficit = Math.max(-300, Math.min(avgDailyDeficit, 1500))
  const lossPerDay = cappedDeficit / 7700

  const endDate = profile.challenge_end_date
    ? new Date(profile.challenge_end_date)
    : new Date(Date.now() + 120 * 86400000)
  const daysLeft = Math.max(0, differenceInDays(endDate, new Date()))

  const timeframes = [
    { label: 'بعد أسبوعين', days: 14 },
    { label: 'بعد شهر', days: 30 },
    { label: 'بعد 3 أشهر', days: 90 },
    { label: 'نهاية التحدي', days: daysLeft },
  ]

  const projections: SmartProjection[] = timeframes.map(({ label, days }) => {
    const weightLoss = Math.max(0, lossPerDay * days)
    const projectedWeight = Math.max(goalWeight - 5, currentWeight - weightLoss)
    return {
      label,
      days,
      projectedWeight: Math.round(projectedWeight * 10) / 10,
      weightLoss: Math.round(weightLoss * 10) / 10,
    }
  })

  const endProjection = projections[projections.length - 1]
  const onTrack = endProjection.projectedWeight <= goalWeight + 1.5

  const recent14 = logs.slice(0, 14)
  const avgCompliance =
    recent14.length > 0
      ? recent14.reduce((s, l) => s + calcDayScore(l), 0) / recent14.length
      : 0

  return {
    onTrack,
    avgDailyDeficit: Math.round(cappedDeficit),
    avgCompliance: Math.round(avgCompliance),
    projections,
  }
}

import { DailyLog, DayCompliance, CHALLENGE_CRITERIA } from '@/types'

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

export function predictGoal(
  logs: DailyLog[],
  currentWeight: number,
  goalWeight: number,
  endDate: string
): { onTrack: boolean; projectedWeight: number; avgCompliance: number } {
  const recent = logs.slice(0, 14)
  if (recent.length === 0) return { onTrack: false, projectedWeight: currentWeight, avgCompliance: 0 }

  const avgCompliance = recent.reduce((s, l) => s + calcDayScore(l), 0) / recent.length
  const deficitDays = recent.filter((l) => (l.calories_consumed || 0) > 0).length
  const avgDeficitRate = deficitDays / recent.length

  const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
  // 500 cal/day deficit ≈ 0.5kg/week loss
  const weeklyLoss = avgDeficitRate * 0.5
  const projectedLoss = (daysLeft / 7) * weeklyLoss
  const projectedWeight = Math.max(goalWeight - 2, currentWeight - projectedLoss)

  const totalWeightToLose = currentWeight - goalWeight
  const onTrack = projectedLoss >= totalWeightToLose * 0.8

  return { onTrack, projectedWeight: Math.round(projectedWeight * 10) / 10, avgCompliance: Math.round(avgCompliance) }
}

export function getWeeklyWorkoutCount(logs: DailyLog[]): { gym: number; cardio: number } {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recent = logs.filter((l) => new Date(l.log_date) >= weekAgo)
  return {
    gym: recent.filter((l) => l.workout_completed).length,
    cardio: recent.filter((l) => (l.workout_data?.cardio_duration ?? 0) > 0).length,
  }
}

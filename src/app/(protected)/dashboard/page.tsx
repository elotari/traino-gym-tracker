'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addMonths, differenceInDays, format, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Flame, Dumbbell, X, RotateCcw, Target, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { DailyLog, DayCompliance, Profile } from '@/types'
import { buildCalendar, getWeeklyWorkoutCount, smartPredict } from '@/lib/compliance'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// ─── Mini SVG ring ────────────────────────────────────────────────────────────
function Ring({
  pct, color, label, sublabel,
}: { pct: number; color: string; label: string; sublabel?: string }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <div className="flex flex-col items-center gap-0.5 w-11">
      <svg width="40" height="40" viewBox="0 0 36 36" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${circ - offset} ${offset}`} strokeLinecap="round"
        />
      </svg>
      <p className="text-white text-[9px] font-black -mt-8 leading-none">{Math.round(pct)}%</p>
      <div className="mt-4 text-center w-full">
        <p className="text-gray-300 text-[8px] font-medium leading-tight text-center break-words">{label}</p>
        {sublabel && <p className="text-[#39FF14] text-[7px] font-bold">{sublabel}</p>}
      </div>
    </div>
  )
}

// ─── Day labels (Sunday-first, Kuwait) ───────────────────────────────────────
const DAY_FULL = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function getLastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return format(d, 'yyyy-MM-dd')
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile, streak, setProfile, logsSavedAt } = useStore()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [calendar, setCalendar] = useState<DayCompliance[]>([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayCompliance | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRestart, setShowRestart] = useState(false)
  const [restartConfirm, setRestartConfirm] = useState('')
  const [restarting, setRestarting] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!user || !profile?.challenge_start_date) { setLoading(false); return }
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('daily_logs').select('*')
        .eq('user_id', user.id)
        .gte('log_date', profile.challenge_start_date!)
        .order('log_date', { ascending: false })
      const fetched = (data || []) as DailyLog[]
      setLogs(fetched)
      setCalendar(buildCalendar(fetched, profile.challenge_start_date!))
      setLoading(false)
    }
    fetchLogs()
  }, [user, profile, logsSavedAt])

  // ── Restart challenge ─────────────────────────────────────────────────────
  const handleRestart = async () => {
    if (restartConfirm !== 'إعادة التحدي') {
      toast.error('اكتب النص الصحيح للتأكيد')
      return
    }
    setRestarting(true)
    try {
      const startDate = format(new Date(), 'yyyy-MM-dd')
      const endDate = format(addMonths(new Date(), 4), 'yyyy-MM-dd')
      const { error } = await supabase
        .from('profiles')
        .update({ challenge_start_date: startDate, challenge_end_date: endDate })
        .eq('id', user!.id)
      if (error) throw error
      setProfile({ ...(profile as Profile), challenge_start_date: startDate, challenge_end_date: endDate })
      setLogs([])
      setCalendar([])
      setShowRestart(false)
      setRestartConfirm('')
      toast.success('تم إعادة التحدي! يلا من الأول 💪')
    } catch (err) {
      toast.error(`خطأ: ${err instanceof Error ? err.message : 'حاول مرة ثانية'}`)
    } finally {
      setRestarting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full" />
    </div>
  )

  if (!profile?.challenge_start_date) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 pb-24">
      <div className="text-center">
        <Dumbbell className="w-16 h-16 text-[#39FF14] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-3">ما أكملت الإعداد</h2>
        <Link href="/onboarding">
          <Button className="bg-[#39FF14] text-black font-bold">ابدأ الإعداد</Button>
        </Link>
      </div>
    </div>
  )

  const endDate = profile.challenge_end_date || ''
  const daysLeft = endDate ? Math.max(0, differenceInDays(new Date(endDate), new Date())) : 0
  const totalDays = profile.challenge_start_date && endDate
    ? differenceInDays(new Date(endDate), new Date(profile.challenge_start_date))
    : 120
  const daysPassed = totalDays - daysLeft
  const progressPct = Math.round((daysPassed / totalDays) * 100)

  const todayLog = logs.find((l) => l.log_date === today)
  const weeklyWorkouts = getWeeklyWorkoutCount(logs)
  const prediction = smartPredict(logs, profile)

  const greenDays = calendar.filter((d) => d.color === 'green').length
  const yellowDays = calendar.filter((d) => d.color === 'yellow').length
  const redDays = calendar.filter((d) => d.color === 'red').length

  // ── Calendar ──────────────────────────────────────────────────────────────
  const monthStart = startOfMonth(calMonth)
  const daysInMonth = getDaysInMonth(calMonth)
  const startDayOfWeek = getDay(monthStart) // Sunday = 0 (Kuwait week)
  const monthStr = format(calMonth, 'yyyy-MM')
  const calendarDayMap = new Map(calendar.map((d) => [d.date, d]))

  const cellColor: Record<string, string> = {
    green:  'bg-[#39FF14]/25 border-[#39FF14]/30 text-[#39FF14]',
    yellow: 'bg-yellow-400/20 border-yellow-400/30 text-yellow-300',
    red:    'bg-red-500/20 border-red-500/30 text-red-400',
    none:   'bg-white/5 border-white/10 text-gray-500',
  }

  // ── 7-day ring data ───────────────────────────────────────────────────────
  const last7 = getLastNDays(7)
  const logMap = new Map(logs.map((l) => [l.log_date, l]))

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-2">
        <p className="text-gray-400 text-sm">{format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}</p>
        <h1 className="text-2xl font-black text-white mt-1">
          أهلاً، <span className="text-[#39FF14]">{profile.username}</span> 💪
        </h1>
      </div>

      <div className="px-4 space-y-4 mt-3">

        {/* ── Countdown ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card-dark rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-gray-400 text-xs mb-1">باقي على انتهاء التحدي</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-[#39FF14] neon-text">{daysLeft}</span>
                <span className="text-white font-bold text-lg">يوم</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">اليوم {daysPassed} من {totalDays}</p>
            </div>
            <div className="text-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                  <motion.circle cx="18" cy="18" r="16" fill="none" stroke="#39FF14" strokeWidth="2.5"
                    strokeDasharray={`${progressPct} 100`} strokeLinecap="round"
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray: `${progressPct} 100` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-[#39FF14]">{progressPct}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-[#39FF14] rounded-full" />
          </div>
        </motion.div>

        {/* ── Challenge Conditions Header ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 }}
          className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
            <h2 className="text-white font-black text-base">شروط التحدي الأسبوعية</h2>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            هذي هي المعايير اللي لازم تلتزم فيها <span className="text-white font-bold">كل أسبوع</span> على مدار <span className="text-[#39FF14] font-bold">4 أشهر</span> كاملة — خطوات يومية، ماء، حديد، وكارديو.
          </p>
        </motion.div>

        {/* ── Steps — 7-day rings ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">👟</span>
            <p className="text-white font-bold text-sm">الخطوات اليومية</p>
            <span className="text-gray-500 text-xs mr-auto">هدف 10,000</span>
          </div>
          <div className="flex justify-between">
            {last7.map((date) => {
              const log = logMap.get(date)
              const pct = Math.min(((log?.steps || 0) / 10000) * 100, 100)
              const dayOfWeek = new Date(date).getDay()
              const isToday = date === today
              return (
                <Ring
                  key={date}
                  pct={pct}
                  color={pct >= 100 ? '#39FF14' : pct >= 50 ? '#A78BFA' : '#374151'}
                  label={DAY_FULL[dayOfWeek]}
                  sublabel={isToday ? 'اليوم' : undefined}
                />
              )
            })}
          </div>
        </motion.div>

        {/* ── Water — 7-day rings ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💧</span>
            <p className="text-white font-bold text-sm">الماء اليومي</p>
            <span className="text-gray-500 text-xs mr-auto">هدف 3L</span>
          </div>
          <div className="flex justify-between">
            {last7.map((date) => {
              const log = logMap.get(date)
              const pct = Math.min(((log?.water_ml || 0) / 3000) * 100, 100)
              const dayOfWeek = new Date(date).getDay()
              const isToday = date === today
              return (
                <Ring
                  key={date}
                  pct={pct}
                  color={pct >= 100 ? '#39FF14' : pct >= 50 ? '#38BDF8' : '#374151'}
                  label={DAY_FULL[dayOfWeek]}
                  sublabel={isToday ? 'اليوم' : undefined}
                />
              )
            })}
          </div>
        </motion.div>

        {/* ── Weekly Workout Summary ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-2">
          {[
            { label: 'تمرين حديد', target: 'هدف 4-5/أسبوع', current: weeklyWorkouts.gym, max: 5, color: '#39FF14' },
            { label: 'كارديو', target: 'هدف 5-7/أسبوع', current: weeklyWorkouts.cardio, max: 7, color: '#38BDF8' },
          ].map((item) => {
            const pct = Math.min((item.current / item.max) * 100, 100)
            return (
              <div key={item.label} className="card-dark rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs">{item.label}</p>
                  <span className="font-black text-white text-lg">{item.current}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                    className="h-full rounded-full" style={{ background: item.color }} />
                </div>
                <p className="text-gray-500 text-xs mt-1">{item.target}</p>
              </div>
            )
          })}
        </motion.div>

        {/* ── Compliance Summary ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          className="grid grid-cols-3 gap-2">
          {[
            { label: 'أيام خضراء', count: greenDays, color: '#39FF14', bg: 'bg-[#39FF14]/10' },
            { label: 'أيام صفراء', count: yellowDays, color: '#FACC15', bg: 'bg-yellow-400/10' },
            { label: 'أيام حمراء', count: redDays, color: '#EF4444', bg: 'bg-red-500/10' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center border border-white/5`}>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Calendar (colored cells) ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="card-dark rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-1 text-gray-400 hover:text-white text-lg">›</button>
            <h3 className="font-bold text-white text-sm">
              {format(calMonth, 'MMMM yyyy', { locale: ar })}
            </h3>
            <button onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-1 text-gray-400 hover:text-white text-lg">‹</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map((d) => (
              <div key={d} className="text-center text-gray-600 text-[10px] py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
              const dayData = calendarDayMap.get(dateStr)
              const dot = dayData?.color || 'none'
              const isToday = dateStr === today
              const isFuture = dateStr > today

              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => dayData?.log && setSelectedDay(dayData)}
                  disabled={isFuture || !dayData?.log}
                  className={`aspect-square rounded-lg border text-xs font-bold flex items-center justify-center transition-all
                    ${cellColor[dot]}
                    ${isToday ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#0A0A0A]' : ''}
                    ${isFuture ? 'opacity-20' : dayData?.log ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}
                  `}
                >
                  {day}
                </motion.button>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
            {[['bg-[#39FF14]', '≥80%'], ['bg-yellow-400', '40-79%'], ['bg-red-500', '<40%']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                <span className="text-xs text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Smart Prediction ── */}
        {prediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="card-dark rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#39FF14]" />
              <h3 className="font-bold text-white text-sm">توقعات الوزن</h3>
              <span className={`mr-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                prediction.onTrack ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-red-500/20 text-red-400'
              }`}>
                {prediction.onTrack ? '✅ على المسار' : '⚠️ مش على المسار'}
              </span>
            </div>
            <p className="text-gray-500 text-xs mb-3">
              متوسط العجز اليومي: <span className="text-white font-bold">{prediction.avgDailyDeficit}</span> سعرة •
              التزام: <span className="text-white font-bold">{prediction.avgCompliance}%</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              {prediction.projections.map((proj) => {
                const reached = proj.projectedWeight <= (profile.goal_weight! + 1.5)
                const close = proj.projectedWeight <= (profile.goal_weight! + 4)
                const color = reached ? 'text-[#39FF14]' : close ? 'text-yellow-300' : 'text-red-400'
                const bg = reached ? 'bg-[#39FF14]/10 border-[#39FF14]/20' : close ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-red-500/10 border-red-500/20'
                return (
                  <div key={proj.label} className={`rounded-xl border p-3 ${bg}`}>
                    <p className="text-gray-400 text-xs">{proj.label}</p>
                    <p className={`font-black text-lg ${color}`}>{proj.projectedWeight} <span className="text-xs font-normal">kg</span></p>
                    <p className="text-gray-500 text-xs">-{proj.weightLoss} kg</p>
                  </div>
                )
              })}
            </div>

            {profile.goal_weight && (
              <p className="text-center text-gray-500 text-xs mt-3">
                الهدف: <span className="text-white font-bold">{profile.goal_weight} kg</span> •
                الوزن الحالي: <span className="text-white font-bold">{profile.current_weight} kg</span>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Today's Log CTA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Link href="/log">
            <Button className={`w-full h-14 font-bold text-base rounded-2xl ${
              todayLog ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90 neon-glow'
            }`}>
              {todayLog ? '✏️ تعديل سجل اليوم' : '📝 سجل يومك الآن!'}
            </Button>
          </Link>
        </motion.div>

        {/* ── Streak ── */}
        {streak && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            className="card-dark rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">الاستمرارية الحالية</p>
              <p className="text-white font-black text-xl">{streak.current_streak} يوم 🔥</p>
            </div>
            <div className="mr-auto text-right">
              <p className="text-gray-400 text-xs">الأطول</p>
              <p className="text-orange-400 font-bold">{streak.longest_streak} يوم</p>
            </div>
          </motion.div>
        )}

        {/* ── Restart Challenge ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button
            onClick={() => setShowRestart(true)}
            className="w-full py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> إعادة التحدي من الصفر
          </button>
        </motion.div>

      </div>

      {/* ── Day Detail Modal ── */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setSelectedDay(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-[#111] rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg">
                  {format(new Date(selectedDay.date), 'EEEE، d MMMM', { locale: ar })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedDay.log ? (
                <div className="space-y-3">
                  <div className={`text-center py-2 rounded-xl font-bold ${
                    selectedDay.color === 'green' ? 'bg-[#39FF14]/20 text-[#39FF14]'
                    : selectedDay.color === 'yellow' ? 'bg-yellow-400/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                  }`}>
                    نقاط الالتزام: {selectedDay.score}%
                  </div>

                  {[
                    { label: `سعرات (${(selectedDay.log.calories_consumed || 0).toLocaleString()})`, done: (selectedDay.log.calories_consumed || 0) > 0 },
                    { label: `ماء (${((selectedDay.log.water_ml || 0) / 1000).toFixed(1)} L)`, done: (selectedDay.log.water_ml || 0) >= 3000 },
                    { label: `خطوات (${(selectedDay.log.steps || 0).toLocaleString()})`, done: (selectedDay.log.steps || 0) >= 10000 },
                    { label: 'تمرين', done: selectedDay.log.workout_completed },
                    { label: 'مكملات', done: selectedDay.log.supplements_taken },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <span>{item.done ? '✅' : '❌'}</span>
                    </div>
                  ))}

                  {(selectedDay.log.workout_data?.types?.length ?? 0) > 0 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">التمرين</p>
                      <p className="text-white text-sm">{selectedDay.log.workout_data!.types.join(' • ')}</p>
                      {selectedDay.log.workout_data?.duration_minutes && (
                        <p className="text-gray-500 text-xs mt-1">
                          {selectedDay.log.workout_data.exercises_count} تمرين • {selectedDay.log.workout_data.duration_minutes} دقيقة
                          {selectedDay.log.workout_data.estimated_calories_burned
                            ? ` • ~${selectedDay.log.workout_data.estimated_calories_burned} سعرة`
                            : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* New multi-session cardio */}
                  {(selectedDay.log.workout_data?.cardio_sessions?.length ?? 0) > 0 &&
                    selectedDay.log.workout_data!.cardio_sessions!.map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">كارديو {i + 1}</p>
                        <p className="text-white text-sm">{s.type} — {s.duration} دقيقة</p>
                        {s.calories_burned > 0 && (
                          <p className="text-gray-500 text-xs">~{s.calories_burned} سعرة</p>
                        )}
                      </div>
                    ))
                  }

                  {/* Legacy single-session cardio fallback */}
                  {!(selectedDay.log.workout_data?.cardio_sessions?.length) &&
                    selectedDay.log.workout_data?.cardio_type && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">الكارديو</p>
                      <p className="text-white text-sm">
                        {selectedDay.log.workout_data.cardio_type} — {selectedDay.log.workout_data.cardio_duration} دقيقة
                      </p>
                    </div>
                  )}

                  {(selectedDay.log.calories_burned || 0) > 0 && (
                    <div className="bg-orange-500/10 rounded-xl p-3 text-center">
                      <p className="text-orange-300 text-sm">
                        🔥 إجمالي محروق: ~<span className="font-black">{selectedDay.log.calories_burned}</span> سعرة
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>ما في سجل لهذا اليوم</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Restart Confirmation Modal ── */}
      <AnimatePresence>
        {showRestart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowRestart(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-[#111] rounded-t-3xl p-6 pb-24"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-red-400 text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" /> إعادة التحدي
                </h3>
                <button onClick={() => setShowRestart(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm font-medium mb-1">⚠️ تحذير</p>
                <p className="text-gray-400 text-sm">
                  بيتم إعادة تاريخ بداية التحدي لليوم، وبتبدأ من يوم 1. السجلات القديمة بتنحفظ بس ما رح تظهر في الداشبورد.
                </p>
              </div>

              <p className="text-gray-400 text-sm mb-2">اكتب <span className="text-white font-bold">إعادة التحدي</span> للتأكيد:</p>
              <Input
                value={restartConfirm}
                onChange={(e) => setRestartConfirm(e.target.value)}
                placeholder="إعادة التحدي"
                className="bg-white/5 border-white/10 text-white h-12 mb-4 text-right"
                dir="rtl"
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowRestart(false)}
                  variant="outline"
                  className="flex-1 h-12 border-white/20 text-gray-300"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleRestart}
                  disabled={restartConfirm !== 'إعادة التحدي' || restarting}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-bold disabled:opacity-40"
                >
                  {restarting ? 'جاري...' : '🔄 إعادة التحدي'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { differenceInDays, format, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Flame, Droplets, Footprints, Dumbbell, Target, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { DailyLog, DayCompliance, CHALLENGE_CRITERIA, WORKOUT_TYPES } from '@/types'
import { buildCalendar, predictGoal, getWeeklyWorkoutCount } from '@/lib/compliance'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, profile, streak } = useStore()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [calendar, setCalendar] = useState<DayCompliance[]>([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayCompliance | null>(null)
  const [loading, setLoading] = useState(true)
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
  }, [user, profile])

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
  const prediction = profile.current_weight && profile.goal_weight && endDate
    ? predictGoal(logs, profile.current_weight, profile.goal_weight, endDate)
    : null

  const greenDays = calendar.filter((d) => d.color === 'green').length
  const yellowDays = calendar.filter((d) => d.color === 'yellow').length
  const redDays = calendar.filter((d) => d.color === 'red').length

  // Calendar rendering
  const monthStart = startOfMonth(calMonth)
  const daysInMonth = getDaysInMonth(calMonth)
  const startDayOfWeek = (getDay(monthStart) + 6) % 7 // Monday-first
  const monthStr = format(calMonth, 'yyyy-MM')
  const calendarDayMap = new Map(calendar.map((d) => [d.date, d]))

  const colorClass = { green: 'bg-[#39FF14]', yellow: 'bg-yellow-400', red: 'bg-red-500', none: 'bg-white/10' }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <p className="text-gray-400 text-sm">{format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}</p>
        <h1 className="text-2xl font-black text-white mt-1">
          أهلاً، <span className="text-[#39FF14]">{profile.username}</span> 💪
        </h1>
      </div>

      <div className="px-4 space-y-4 mt-3">
        {/* Countdown */}
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
              <p className="text-gray-500 text-xs mt-1">مكتمل</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-[#39FF14] rounded-full" />
          </div>
        </motion.div>

        {/* Challenge Rules */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="card-dark rounded-2xl p-4">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#39FF14]" /> شروط التحدي الأسبوعية
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'تمرين حديد', target: '4-5 أيام/أسبوع', current: weeklyWorkouts.gym, max: 5, color: '#39FF14' },
              { label: 'كارديو', target: '5-7 أيام/أسبوع', current: weeklyWorkouts.cardio, max: 7, color: '#38BDF8' },
              { label: 'خطوات يومية', target: '10,000+', current: todayLog?.steps || 0, max: 10000, color: '#A78BFA' },
              { label: 'ماء يومي', target: '3 لتر+', current: todayLog?.water_goal_achieved ? 3 : 0, max: 3, color: '#34D399' },
            ].map((item) => {
              const pct = Math.min((item.current / item.max) * 100, 100)
              const ok = item.current >= item.max
              return (
                <div key={item.label} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <span className={`text-xs font-bold ${ok ? 'text-[#39FF14]' : 'text-gray-500'}`}>{ok ? '✓' : item.target}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      className="h-full rounded-full" style={{ background: item.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Compliance Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
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

        {/* Calendar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="card-dark rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-1 text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
            <h3 className="font-bold text-white text-sm">
              {format(calMonth, 'MMMM yyyy', { locale: ar })}
            </h3>
            <button onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-1 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'].map((d) => (
              <div key={d} className="text-center text-gray-600 text-xs py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
              const dayData = calendarDayMap.get(dateStr)
              const isToday = dateStr === today
              const dot = dayData?.color || 'none'
              const isFuture = dateStr > today

              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => dayData && setSelectedDay(dayData)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative
                    ${isToday ? 'ring-1 ring-[#39FF14]' : ''}
                    ${isFuture ? 'opacity-30' : 'cursor-pointer hover:bg-white/5'}
                  `}
                >
                  <span className={`text-xs ${isToday ? 'text-[#39FF14] font-bold' : 'text-gray-300'}`}>{day}</span>
                  {!isFuture && (
                    <div className={`w-1.5 h-1.5 rounded-full ${colorClass[dot]}`} />
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
            {[['bg-[#39FF14]', '≥80%'], ['bg-yellow-400', '40-79%'], ['bg-red-500', '<40%']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                <span className="text-xs text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Prediction */}
        {prediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className={`rounded-2xl p-5 border ${prediction.onTrack ? 'bg-[#39FF14]/8 border-[#39FF14]/30' : 'bg-red-500/8 border-red-500/30'}`}>
            <div className="flex items-center gap-3">
              {prediction.onTrack
                ? <TrendingDown className="w-6 h-6 text-[#39FF14] flex-shrink-0" />
                : <TrendingUp className="w-6 h-6 text-red-400 flex-shrink-0" />}
              <div>
                <p className={`font-bold ${prediction.onTrack ? 'text-[#39FF14]' : 'text-red-400'}`}>
                  {prediction.onTrack ? '🎯 أنت على المسار الصح!' : '⚠️ مش على المسار!'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  بناءً على أدائك ({prediction.avgCompliance}% التزام متوسط)،
                  وزنك المتوقع بنهاية التحدي:{' '}
                  <span className="font-bold text-white">{prediction.projectedWeight} kg</span>
                  {' '}(الهدف: {profile.goal_weight} kg)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Today's Log CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <Link href="/log">
            <Button className={`w-full h-14 font-bold text-base rounded-2xl ${todayLog ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90 neon-glow'}`}>
              {todayLog ? '✏️ تعديل سجل اليوم' : '📝 سجل يومك الآن!'}
            </Button>
          </Link>
        </motion.div>

        {/* Streak */}
        {streak && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
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
      </div>

      {/* Day Detail Modal */}
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
                <button onClick={() => setSelectedDay(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
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
                    { label: 'عجز السعرات ≥500', done: selectedDay.log.calorie_deficit_achieved },
                    { label: 'شرب الماء 3L+', done: selectedDay.log.water_goal_achieved },
                    { label: `خطوات (${(selectedDay.log.steps || 0).toLocaleString()})`, done: selectedDay.log.steps >= 10000 },
                    { label: 'نوم كافي', done: selectedDay.log.sleep_good },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <span>{item.done ? '✅' : '❌'}</span>
                    </div>
                  ))}
                  {selectedDay.log.workout_types?.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">التمرين</p>
                      <p className="text-white text-sm">{selectedDay.log.workout_types.join(' • ')}</p>
                    </div>
                  )}
                  {selectedDay.log.cardio_type && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">الكارديو</p>
                      <p className="text-white text-sm">{selectedDay.log.cardio_type} — {selectedDay.log.cardio_duration} دقيقة</p>
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
    </div>
  )
}

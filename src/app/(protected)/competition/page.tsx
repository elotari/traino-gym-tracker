'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, subDays } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Trophy, Skull, Crown, Flame, Footprints, Dumbbell, Droplets, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { DailyLog, Profile, CompetitionData, CHALLENGE_CRITERIA } from '@/types'
import { calcDayScore, scoreToColor } from '@/lib/compliance'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const LOSER_ROASTS = [
  "يا عيب الشوم عليك! ابن عمك بيتمرن وانت قاعد تتخيل العضلات! 😂",
  "هذا مو تحدي، هذا إهانة! اشحد من ابن عمك كيف يتمرن! 💀",
  "جدتي الـ 70 سنة بتمشي أكثر منك! وين الـ 10 آلاف خطوة؟ 🦴",
  "ابن عمك يتعذب بالجيم وانت تتعذب بالكنبة؟ فرق يا أخي! 🛋️",
  "شوف الفرق: ابن عمك يشرب ماء، انت تشرب أعذار! 💧",
  "خسران بهالأرقام ولسا عندك وجه تفتح التطبيق؟ 😤",
]

const WINNER_PRAISE = [
  "أنت الأسطورة! ابن عمك بكي من الخزي وانت ما تعرف! 👑",
  "فرق شاسع! ابن عمك ولا فاهم كيف تسبقه! 🔥",
  "استمر هيك وبكرة ابن عمك يطلب منك نصايح! 💪",
  "هذا هو الكلام! ابن عمك خسران على طول الخط! 🏆",
]

function getRandomRoast(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function CompetitionPage() {
  const { user } = useStore()
  const [data, setData] = useState<CompetitionData[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<{ date: string; [k: string]: string | number }[]>([])

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')

    const profilesRes = await supabase.from('profiles').select('*')
    const profiles = (profilesRes.data || []) as Profile[]
    if (profiles.length < 2) { setLoading(false); return }

    const result: CompetitionData[] = []

    for (const profile of profiles) {
      const { data: logs } = await supabase.from('daily_logs').select('*')
        .eq('user_id', profile.id)
        .gte('log_date', profile.challenge_start_date || weekAgo)
        .order('log_date', { ascending: false })

      const { data: streak } = await supabase.from('streaks').select('*')
        .eq('user_id', profile.id).single()

      const weeklyLogs = (logs || []).filter((l: DailyLog) => l.log_date >= weekAgo) as DailyLog[]
      const allLogs = (logs || []) as DailyLog[]

      const greenDays = allLogs.filter((l) => scoreToColor(calcDayScore(l)) === 'green').length
      const yellowDays = allLogs.filter((l) => scoreToColor(calcDayScore(l)) === 'yellow').length
      const redDays = allLogs.filter((l) => scoreToColor(calcDayScore(l)) === 'red').length
      const weeklyCompliance = weeklyLogs.length > 0
        ? Math.round(weeklyLogs.reduce((s, l) => s + calcDayScore(l), 0) / weeklyLogs.length)
        : 0

      result.push({ profile, streak: streak || null, weeklyCompliance, greenDays, yellowDays, redDays, totalLoggedDays: allLogs.length, recentLogs: weeklyLogs })
    }

    setData(result)

    // Chart: last 7 days compliance
    if (result.length >= 2) {
      const dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))
      const cd = dates.map((d) => {
        const entry: { date: string; [k: string]: string | number } = { date: format(new Date(d), 'dd/MM') }
        result.forEach((r) => {
          const log = r.recentLogs.find((l) => l.log_date === d)
          entry[r.profile.username] = log ? calcDayScore(log) : 0
        })
        return entry
      })
      setChartData(cd)
    }

    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full" />
    </div>
  )

  if (data.length < 2) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 pb-24">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-[#39FF14] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">في انتظار المنافس</h2>
        <p className="text-gray-400 text-sm">ابن عمك لم ينضم بعد! 😴</p>
      </div>
    </div>
  )

  const [me, cousin] = data[0].profile.id === user?.id ? [data[0], data[1]] : [data[1], data[0]]

  const metrics = [
    { label: 'الالتزام الأسبوعي', key: 'weeklyCompliance', myVal: me.weeklyCompliance, theirVal: cousin.weeklyCompliance, unit: '%', icon: Trophy, color: '#39FF14' },
    { label: 'أيام خضراء', key: 'green', myVal: me.greenDays, theirVal: cousin.greenDays, unit: 'يوم', icon: Flame, color: '#39FF14' },
    { label: 'أيام محترمة', key: 'logged', myVal: me.totalLoggedDays, theirVal: cousin.totalLoggedDays, unit: 'يوم', icon: Dumbbell, color: '#38BDF8' },
    { label: 'الاستمرارية', key: 'streak', myVal: me.streak?.current_streak || 0, theirVal: cousin.streak?.current_streak || 0, unit: 'يوم', icon: Flame, color: '#FB923C' },
  ]

  const myScore = metrics.filter((m) => m.myVal >= m.theirVal).length
  const theirScore = metrics.filter((m) => m.theirVal > m.myVal).length
  const iWinning = myScore >= theirScore

  const roast = getRandomRoast(iWinning ? WINNER_PRAISE : LOSER_ROASTS)

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28">
      <div className="px-4 pt-12 pb-4">
        <p className="text-gray-400 text-sm">{format(new Date(), 'EEEE، d MMMM', { locale: ar })}</p>
        <h1 className="text-2xl font-black text-white mt-1">
          لوحة <span className="text-[#39FF14]">التحدي</span> 🏆
        </h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Roast Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 border ${iWinning ? 'bg-[#39FF14]/8 border-[#39FF14]/30' : 'bg-red-500/8 border-red-500/30'}`}>
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">{iWinning ? '👑' : '💀'}</span>
            <p className={`text-sm font-medium leading-relaxed ${iWinning ? 'text-[#39FF14]' : 'text-red-300'}`}>{roast}</p>
          </div>
        </motion.div>

        {/* Score Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="card-dark rounded-2xl p-5">
          <div className="flex items-center justify-between">
            {/* Me */}
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-2xl bg-[#39FF14]/20 border border-[#39FF14]/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💪</span>
              </div>
              <p className="font-bold text-white text-sm">{me.profile.username}</p>
              <p className="text-[#39FF14] text-xs">أنت</p>
              <p className="text-3xl font-black text-white mt-2">{myScore}</p>
            </div>

            {/* VS */}
            <div className="text-center px-4">
              <p className="text-gray-500 font-black text-2xl">VS</p>
              <div className={`mt-1 text-xs font-bold px-3 py-1 rounded-full ${iWinning ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-red-500/20 text-red-400'}`}>
                {iWinning ? 'أنت الأفضل' : 'خسران'}
              </div>
            </div>

            {/* Cousin */}
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🏋️</span>
              </div>
              <p className="font-bold text-white text-sm">{cousin.profile.username}</p>
              <p className="text-pink-400 text-xs">ابن عمك</p>
              <p className="text-3xl font-black text-white mt-2">{theirScore}</p>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        {metrics.map((m, i) => {
          const iWin = m.myVal >= m.theirVal
          const max = Math.max(m.myVal, m.theirVal, 1)
          return (
            <motion.div key={m.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }} className="card-dark rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  <span className="text-gray-300 text-sm">{m.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${iWin ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-red-500/20 text-red-400'}`}>
                  {iWin ? 'أنت ✓' : 'خسران 💀'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* My bar */}
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(m.myVal / max) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.7 }}
                      className="h-full rounded-full bg-[#39FF14]" />
                  </div>
                  <p className={`text-sm font-black ${iWin ? 'text-white' : 'text-gray-500'}`}>
                    {m.myVal}{m.unit !== '%' ? '' : '%'} <span className="text-xs font-normal text-gray-500">{m.unit !== '%' ? m.unit : ''}</span>
                  </p>
                </div>
                <span className="text-gray-600 text-xs">vs</span>
                {/* Cousin bar */}
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(m.theirVal / max) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.7 }}
                      className="h-full rounded-full bg-pink-500" />
                  </div>
                  <p className={`text-sm font-black text-left ${!iWin ? 'text-white' : 'text-gray-500'}`}>
                    {m.theirVal}{m.unit !== '%' ? '' : '%'}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Weekly Compliance Chart */}
        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="card-dark rounded-2xl p-4">
            <h3 className="font-bold text-white mb-4 text-sm">نقاط الالتزام — آخر 7 أيام</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: 12 }}
                  formatter={(val) => [`${val}%`, '']} />
                <Bar dataKey={me.profile.username} fill="#39FF14" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey={cousin.profile.username} fill="#EC4899" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#39FF14]" /><span className="text-xs text-gray-400">{me.profile.username}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-pink-500" /><span className="text-xs text-gray-400">{cousin.profile.username}</span></div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard of Shame */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4">
          <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2 text-sm">
            <Skull className="w-4 h-4" /> لوحة العار 😂
          </h3>
          <div className="space-y-2">
            {[
              { q: 'أكثر أيام حمراء (فاشل)', myVal: me.redDays, theirVal: cousin.redDays, loserHigher: true },
              { q: 'أقل أيام خضراء (كسلان)', myVal: me.greenDays, theirVal: cousin.greenDays, loserHigher: false },
              { q: 'أضعف الاستمرارية', myVal: me.streak?.current_streak || 0, theirVal: cousin.streak?.current_streak || 0, loserHigher: false },
            ].map((item) => {
              const meLoser = item.loserHigher ? item.myVal > item.theirVal : item.myVal < item.theirVal
              const loserName = meLoser ? me.profile.username : cousin.profile.username
              return (
                <div key={item.q} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-xl">
                  <span className="text-gray-400">{item.q}</span>
                  <span className="text-red-400 font-bold">{loserName} 😅</span>
                </div>
              )
            })}
          </div>
          <p className="text-center text-gray-600 text-xs mt-3">
            {iWinning ? 'ابن عمك بيقرأ هذا ويبكي 😂' : 'انت بتقرأ هذا وتبكي 😂'}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

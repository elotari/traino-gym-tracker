'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Check, Plus, Minus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { CardioSession, DailyLog, WORKOUT_TYPES, CARDIO_TYPES, SUPPLEMENTS } from '@/types'
import { estimateWeightCalories, estimateCardioCalories } from '@/lib/calorieCalc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LogPage() {
  const { user, profile, markLogSaved } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const bodyWeight = profile?.current_weight ?? 80

  // ── Core metrics ──────────────────────────────────────────────────────────
  const [caloriesConsumed, setCaloriesConsumed] = useState(0)
  const [waterMl, setWaterMl] = useState(0)
  const [steps, setSteps] = useState(0)

  // ── Workout ───────────────────────────────────────────────────────────────
  const [workoutTypes, setWorkoutTypes] = useState<string[]>([])
  const [exercisesCount, setExercisesCount] = useState(0)
  const [workoutDuration, setWorkoutDuration] = useState(0)

  // ── Cardio (multiple sessions) ────────────────────────────────────────────
  const [cardioSessions, setCardioSessions] = useState<{ type: string; duration: number }[]>([])
  const [showCardio, setShowCardio] = useState(false)

  // ── Supplements ───────────────────────────────────────────────────────────
  const [supplementList, setSupplementList] = useState<string[]>([])
  const [showSupplements, setShowSupplements] = useState(false)

  const [saving, setSaving] = useState(false)

  // ── Derived ───────────────────────────────────────────────────────────────
  const isRestDay = workoutTypes.length === 0 || workoutTypes.every((t) => t === 'rest')
  const hasWorkout = !isRestDay

  const weightCalories = useMemo(
    () => (hasWorkout ? estimateWeightCalories(bodyWeight, workoutDuration) : 0),
    [hasWorkout, bodyWeight, workoutDuration]
  )

  const cardioCaloriesList = useMemo(
    () => cardioSessions.map((s) => estimateCardioCalories(s.type, s.duration, bodyWeight)),
    [cardioSessions, bodyWeight]
  )

  const totalCardioCalories = cardioCaloriesList.reduce((a, b) => a + b, 0)
  const totalCaloriesBurned = weightCalories + totalCardioCalories

  // ── Load existing log ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single()
      if (!data) return
      const log = data as DailyLog
      setCaloriesConsumed(log.calories_consumed || 0)
      setWaterMl(log.water_ml || 0)
      setSteps(log.steps || 0)
      setSupplementList(log.supplement_list || [])

      if (log.workout_data) {
        setWorkoutTypes(log.workout_data.types || [])
        setExercisesCount(log.workout_data.exercises_count || 0)
        setWorkoutDuration(log.workout_data.duration_minutes || 0)

        // Handle new multi-session format; fall back to legacy single-session
        if ((log.workout_data.cardio_sessions?.length ?? 0) > 0) {
          setCardioSessions(
            log.workout_data.cardio_sessions!.map((s) => ({ type: s.type, duration: s.duration }))
          )
          setShowCardio(true)
        } else if (log.workout_data.cardio_type) {
          setCardioSessions([{ type: log.workout_data.cardio_type, duration: log.workout_data.cardio_duration || 0 }])
          setShowCardio(true)
        }
      }
      setShowSupplements((log.supplement_list || []).length > 0)
    }
    fetchExisting()
  }, [user, today])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleWorkout = (id: string) => {
    if (id === 'rest') {
      setWorkoutTypes((prev) => (prev.includes('rest') ? [] : ['rest']))
      setExercisesCount(0)
      setWorkoutDuration(0)
    } else {
      setWorkoutTypes((prev) => {
        const without = prev.filter((w) => w !== 'rest')
        return without.includes(id) ? without.filter((w) => w !== id) : [...without, id]
      })
    }
  }

  const toggleSupplement = (s: string) =>
    setSupplementList((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const addCardioSession = () =>
    setCardioSessions((prev) => [...prev, { type: CARDIO_TYPES[0], duration: 30 }])

  const removeCardioSession = (i: number) =>
    setCardioSessions((prev) => prev.filter((_, idx) => idx !== i))

  const updateSession = (i: number, key: 'type' | 'duration', val: string | number) =>
    setCardioSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)))

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!user) {
      toast.error('غير مسجل الدخول')
      return
    }
    setSaving(true)
    try {
      const cardioWithCalories: CardioSession[] = cardioSessions.map((s, i) => ({
        type: s.type,
        duration: s.duration,
        calories_burned: cardioCaloriesList[i] ?? 0,
      }))

      const payload = {
        user_id: user.id,
        log_date: today,
        calories_consumed: caloriesConsumed,
        calories_burned: totalCaloriesBurned,
        steps,
        water_ml: waterMl,
        workout_completed: hasWorkout,
        workout_data: {
          types: workoutTypes,
          exercises_count: hasWorkout ? exercisesCount : null,
          duration_minutes: hasWorkout ? workoutDuration : null,
          estimated_calories_burned: hasWorkout ? weightCalories : null,
          cardio_sessions: cardioWithCalories,
        },
        supplements_taken: supplementList.length > 0,
        supplement_list: supplementList,
      }

      const { error } = await supabase
        .from('daily_logs')
        .upsert(payload, { onConflict: 'user_id,log_date' })
      if (error) throw error
      markLogSaved()
      toast.success('تم الحفظ! 💪')
    } catch (err) {
      console.error('Log save error:', err)
      toast.error(`خطأ في الحفظ: ${err instanceof Error ? err.message : JSON.stringify(err)}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Reusable stepper ──────────────────────────────────────────────────────
  const Stepper = ({
    value, onChange, step = 1, min = 0, max = 99999, color = 'green',
  }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; color?: 'green' | 'blue' }) => (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
      >
        <Minus className="w-4 h-4 text-white" />
      </button>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        className="flex-1 bg-white/5 border-white/10 text-white text-xl font-black h-12 text-center"
      />
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
          color === 'green' ? 'bg-[#39FF14]/20 hover:bg-[#39FF14]/30' : 'bg-blue-500/20 hover:bg-blue-500/30'
        }`}
      >
        <Plus className={`w-4 h-4 ${color === 'green' ? 'text-[#39FF14]' : 'text-blue-400'}`} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28">
      <div className="px-4 pt-12 pb-4">
        <p className="text-gray-400 text-sm">{format(new Date(), 'EEEE، d MMMM', { locale: ar })}</p>
        <h1 className="text-2xl font-black text-white mt-1">
          سجل <span className="text-[#39FF14]">يومك</span>
        </h1>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Calories Consumed ── */}
        <div className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <p className="text-white font-medium text-sm">السعرات المأكولة</p>
              <p className="text-gray-500 text-xs">الهدف: أقل من TDEE بـ500 سعرة</p>
            </div>
          </div>
          <Stepper value={caloriesConsumed} onChange={setCaloriesConsumed} step={50} max={10000} />
          <div className="flex gap-2 mt-3">
            {[1500, 1800, 2000, 2500].map((n) => (
              <button
                key={n}
                onClick={() => setCaloriesConsumed(n)}
                className={`flex-1 text-xs border rounded-lg py-2 transition-all ${
                  caloriesConsumed === n
                    ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                }`}
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* ── Water ── */}
        <div className="card-dark rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💧</span>
              <div>
                <p className="text-white font-medium text-sm">الماء</p>
                <p className="text-gray-500 text-xs">الهدف: 3,000 مل</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-white font-black text-xl">{(waterMl / 1000).toFixed(1)}<span className="text-sm font-normal text-gray-400"> L</span></p>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <motion.div
              animate={{ width: `${Math.min((waterMl / 3000) * 100, 100)}%` }}
              className={`h-full rounded-full transition-colors ${waterMl >= 3000 ? 'bg-[#39FF14]' : 'bg-blue-400'}`}
            />
          </div>
          <div className="flex gap-2">
            {[500, 1000, 1500, 2000, 2500, 3000].map((n) => (
              <button
                key={n}
                onClick={() => setWaterMl(n)}
                className={`flex-1 text-xs border rounded-lg py-2 transition-all ${
                  waterMl === n
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                }`}
              >
                {n >= 1000 ? `${n / 1000}L` : n}
              </button>
            ))}
          </div>
        </div>

        {/* ── Steps ── */}
        <div className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👟</span>
            <div>
              <p className="text-white font-medium text-sm">الخطوات</p>
              <p className="text-gray-500 text-xs">الهدف: 10,000 خطوة</p>
            </div>
          </div>
          <Stepper value={steps} onChange={setSteps} step={500} max={50000} />
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${Math.min((steps / 10000) * 100, 100)}%` }}
              className={`h-full rounded-full ${steps >= 10000 ? 'bg-[#39FF14]' : 'bg-purple-400'}`}
            />
          </div>
          <p className="text-center text-xs text-gray-500 mt-1">
            {steps >= 10000 ? '🎉 وصلت الهدف!' : `${Math.max(0, 10000 - steps).toLocaleString()} خطوة باقية`}
          </p>
          <div className="flex gap-2 mt-3">
            {[1000, 2000, 5000].map((n) => (
              <button
                key={n}
                onClick={() => setSteps((v) => Math.min(v + n, 50000))}
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg py-2 text-gray-300 hover:border-white/30 transition-all"
              >
                +{n.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* ── Workout Types ── */}
        <div className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏋️</span>
            <p className="text-white font-medium text-sm">شو كان تمرين اليوم؟</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WORKOUT_TYPES.map((w) => {
              const selected = workoutTypes.includes(w.id)
              const isRest = w.id === 'rest'
              return (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleWorkout(w.id)}
                  className={`py-3 px-2 rounded-xl text-center transition-all border ${
                    selected
                      ? isRest
                        ? 'bg-gray-500/20 border-gray-400 text-gray-300'
                        : 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <div className="text-xl">{w.emoji}</div>
                  <div className="text-xs font-bold mt-1">{w.label}</div>
                </motion.button>
              )
            })}
          </div>

          {/* Rest day notice */}
          <AnimatePresence>
            {workoutTypes.includes('rest') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-gray-500/10 border border-gray-500/30 rounded-xl p-3 text-center"
              >
                <p className="text-gray-400 text-sm">😴 يوم راحة — لا يحسب تمرين حديد</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Workout details (only if non-rest workout selected) */}
          <AnimatePresence>
            {hasWorkout && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                <div className="h-px bg-white/10" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400 text-xs mb-2">عدد التمارين</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExercisesCount((v) => Math.max(0, v - 1))}
                        className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <p className="flex-1 text-center text-white font-black text-2xl">{exercisesCount}</p>
                      <button
                        onClick={() => setExercisesCount((v) => v + 1)}
                        className="w-10 h-10 rounded-xl bg-[#39FF14]/20 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 text-[#39FF14]" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-2">مدة التمرين (دقيقة)</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWorkoutDuration((v) => Math.max(0, v - 5))}
                        className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <p className="flex-1 text-center text-white font-black text-2xl">{workoutDuration}</p>
                      <button
                        onClick={() => setWorkoutDuration((v) => v + 5)}
                        className="w-10 h-10 rounded-xl bg-[#39FF14]/20 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 text-[#39FF14]" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => setWorkoutDuration(m)}
                      className={`flex-1 text-xs border rounded-lg py-1.5 transition-all ${
                        workoutDuration === m
                          ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      {m}د
                    </button>
                  ))}
                </div>
                {weightCalories > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <p className="text-orange-300 text-sm">
                      سعرات محروقة تقريبية من الحديد:{' '}
                      <span className="font-black">~{weightCalories}</span> سعرة
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Cardio (multiple sessions) ── */}
        <div className="card-dark rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowCardio(!showCardio)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏃</span>
              <div className="text-right">
                <p className="text-white font-medium text-sm">الكارديو</p>
                {cardioSessions.length > 0 && (
                  <p className="text-blue-400 text-xs">
                    {cardioSessions.length} جلسة • ~{totalCardioCalories} سعرة
                  </p>
                )}
              </div>
            </div>
            {showCardio ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          <AnimatePresence>
            {showCardio && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {cardioSessions.map((session, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-bold">جلسة {i + 1}</p>
                        <button
                          onClick={() => removeCardioSession(i)}
                          className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>

                      {/* Type selector */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {CARDIO_TYPES.map((ct) => (
                          <button
                            key={ct}
                            onClick={() => updateSession(i, 'type', ct)}
                            className={`py-1.5 px-2 rounded-lg text-xs text-right transition-all border ${
                              session.type === ct
                                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                                : 'bg-white/5 border-white/10 text-gray-400'
                            }`}
                          >
                            {ct}
                          </button>
                        ))}
                      </div>

                      {/* Duration */}
                      <div>
                        <p className="text-gray-400 text-xs mb-2">المدة (دقيقة)</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSession(i, 'duration', Math.max(0, session.duration - 5))}
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3 text-white" />
                          </button>
                          <p className="flex-1 text-center text-white font-black text-xl">{session.duration}</p>
                          <button
                            onClick={() => updateSession(i, 'duration', session.duration + 5)}
                            className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3 text-blue-400" />
                          </button>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {[20, 30, 45, 60].map((m) => (
                            <button
                              key={m}
                              onClick={() => updateSession(i, 'duration', m)}
                              className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg py-1.5 text-gray-300"
                            >
                              {m}د
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Calories estimate */}
                      {cardioCaloriesList[i] > 0 && (
                        <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                          <p className="text-blue-300 text-xs">
                            🔥 ~<span className="font-black">{cardioCaloriesList[i]}</span> سعرة محروقة
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addCardioSession}
                    className="w-full py-3 rounded-xl border border-dashed border-blue-400/40 text-blue-400 text-sm flex items-center justify-center gap-2 hover:bg-blue-500/5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> أضف جلسة كارديو
                  </button>

                  {totalCardioCalories > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                      <p className="text-orange-300 text-sm">
                        إجمالي الكارديو: ~<span className="font-black">{totalCardioCalories}</span> سعرة
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Total Burn Summary ── */}
        {totalCaloriesBurned > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#39FF14]/8 border border-[#39FF14]/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-gray-400 text-xs">إجمالي السعرات المحروقة اليوم</p>
              <p className="text-[#39FF14] font-black text-2xl">~{totalCaloriesBurned} <span className="text-sm font-normal">سعرة</span></p>
            </div>
          </motion.div>
        )}

        {/* ── Supplements ── */}
        <div className="card-dark rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSupplements(!showSupplements)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💊</span>
              <div className="text-right">
                <p className="text-white font-medium text-sm">المكملات</p>
                {supplementList.length > 0 && (
                  <p className="text-green-400 text-xs">{supplementList.length} مكمل</p>
                )}
              </div>
            </div>
            {showSupplements ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          <AnimatePresence>
            {showSupplements && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {SUPPLEMENTS.map((s) => {
                    const checked = supplementList.includes(s)
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSupplement(s)}
                        className={`py-2.5 px-3 rounded-xl text-sm text-right transition-all border flex items-center gap-2 ${
                          checked
                            ? 'bg-green-500/15 border-green-400/40 text-green-300'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                            checked ? 'bg-green-400' : 'border border-gray-500'
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Save ── */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={save}
            disabled={saving}
            className="w-full h-14 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-black text-base rounded-2xl neon-glow"
          >
            {saving ? 'جاري الحفظ...' : '💾 حفظ السجل'}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

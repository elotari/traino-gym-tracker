'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Check, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { DailyLog, WORKOUT_TYPES, CARDIO_TYPES, SUPPLEMENTS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LogPage() {
  const { user } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [caloriesConsumed, setCaloriesConsumed] = useState(0)
  const [waterMl, setWaterMl] = useState(0)
  const [steps, setSteps] = useState(0)
  const [workoutTypes, setWorkoutTypes] = useState<string[]>([])
  const [cardioType, setCardioType] = useState<string | null>(null)
  const [cardioDuration, setCardioDuration] = useState(0)
  const [supplementList, setSupplementList] = useState<string[]>([])
  const [notes, setNotes] = useState<string>('')

  const [saving, setSaving] = useState(false)
  const [showCardio, setShowCardio] = useState(false)
  const [showSupplements, setShowSupplements] = useState(false)

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
      setNotes(log.notes || '')
      if (log.workout_data) {
        setWorkoutTypes(log.workout_data.types || [])
        setCardioType(log.workout_data.cardio_type || null)
        setCardioDuration(log.workout_data.cardio_duration || 0)
        setShowCardio(!!log.workout_data.cardio_type)
      }
      setShowSupplements((log.supplement_list || []).length > 0)
    }
    fetchExisting()
  }, [user, today])

  const toggleWorkout = (id: string) => {
    setWorkoutTypes((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }

  const toggleSupplement = (s: string) => {
    setSupplementList((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const save = async () => {
    if (!user) {
      toast.error('غير مسجل الدخول، حاول تسجل الدخول مرة ثانية')
      return
    }
    setSaving(true)
    try {
      const workoutCompleted = workoutTypes.length > 0 && !workoutTypes.includes('rest')
      const payload = {
        user_id: user.id,
        log_date: today,
        calories_consumed: caloriesConsumed,
        calories_burned: 0,
        steps,
        water_ml: waterMl,
        workout_completed: workoutCompleted,
        workout_data: {
          types: workoutTypes,
          cardio_type: cardioType,
          cardio_duration: cardioDuration || null,
        },
        supplements_taken: supplementList.length > 0,
        supplement_list: supplementList,
        notes: notes || null,
      }
      const { error } = await supabase.from('daily_logs').upsert(payload, {
        onConflict: 'user_id,log_date',
      })
      if (error) throw error
      toast.success('تم الحفظ! 💪')
    } catch (err) {
      console.error('Log save error:', err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      toast.error(`خطأ في الحفظ: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28">
      <div className="px-4 pt-12 pb-4">
        <p className="text-gray-400 text-sm">{format(new Date(), 'EEEE، d MMMM', { locale: ar })}</p>
        <h1 className="text-2xl font-black text-white mt-1">سجل <span className="text-[#39FF14]">يومك</span></h1>
      </div>

      <div className="px-4 space-y-3">

        {/* Calories Consumed */}
        <motion.div whileTap={{ scale: 0.98 }} className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-white font-medium text-sm">كم سعرة أكلت اليوم؟</p>
              <p className="text-gray-500 text-xs">الهدف: أقل من TDEE بـ 500 سعرة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCaloriesConsumed((v) => Math.max(0, v - 50))}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1">
              <Input type="number" value={caloriesConsumed}
                onChange={(e) => setCaloriesConsumed(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white text-xl font-black h-12 text-center" />
            </div>
            <button onClick={() => setCaloriesConsumed((v) => v + 50)}
              className="w-12 h-12 rounded-xl bg-[#39FF14]/20 flex items-center justify-center hover:bg-[#39FF14]/30 active:scale-95 transition-all">
              <Plus className="w-4 h-4 text-[#39FF14]" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {[1500, 1800, 2000, 2500].map((n) => (
              <button key={n} onClick={() => setCaloriesConsumed(n)}
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg py-2 text-gray-300 hover:border-white/30 transition-all">
                {n.toLocaleString()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Water */}
        <motion.div whileTap={{ scale: 0.98 }} className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-white font-medium text-sm">كم شربت ماء؟</p>
              <p className="text-gray-500 text-xs">الهدف: 3,000 مل (3 لتر)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setWaterMl((v) => Math.max(0, v - 250))}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-white text-2xl font-black">{(waterMl / 1000).toFixed(1)} <span className="text-sm font-normal text-gray-400">لتر</span></p>
              <p className="text-gray-500 text-xs">{waterMl} مل</p>
            </div>
            <button onClick={() => setWaterMl((v) => v + 250)}
              className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 active:scale-95 transition-all">
              <Plus className="w-4 h-4 text-blue-400" />
            </button>
          </div>
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${Math.min((waterMl / 3000) * 100, 100)}%` }}
              className={`h-full rounded-full ${waterMl >= 3000 ? 'bg-[#39FF14]' : 'bg-blue-400'}`} />
          </div>
          <div className="flex gap-2 mt-3">
            {[500, 1000, 1500, 2000, 2500, 3000].map((n) => (
              <button key={n} onClick={() => setWaterMl(n)}
                className={`flex-1 text-xs border rounded-lg py-2 transition-all ${waterMl === n ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'}`}>
                {n >= 1000 ? `${n / 1000}L` : `${n}`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div whileTap={{ scale: 0.98 }} className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👟</span>
            <div>
              <p className="text-white font-medium text-sm">كم خطوة مشيت اليوم؟</p>
              <p className="text-gray-500 text-xs">الهدف: 10,000 خطوة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSteps((v) => Math.max(0, v - 500))}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1">
              <Input type="number" value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white text-xl font-black h-12 text-center" />
            </div>
            <button onClick={() => setSteps((v) => v + 500)}
              className="w-12 h-12 rounded-xl bg-[#39FF14]/20 flex items-center justify-center hover:bg-[#39FF14]/30 active:scale-95 transition-all">
              <Plus className="w-4 h-4 text-[#39FF14]" />
            </button>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${Math.min((steps / 10000) * 100, 100)}%` }}
              className={`h-full rounded-full ${steps >= 10000 ? 'bg-[#39FF14]' : 'bg-blue-400'}`} />
          </div>
          <p className="text-center text-xs text-gray-500 mt-1">
            {steps >= 10000 ? '🎉 وصلت الهدف!' : `${Math.max(0, 10000 - steps).toLocaleString()} خطوة باقية`}
          </p>
          <div className="flex gap-2 mt-3">
            {[1000, 2000, 5000].map((n) => (
              <button key={n} onClick={() => setSteps((v) => Math.min(v + n, 50000))}
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg py-2 text-gray-300 hover:border-white/30 transition-all">
                +{n.toLocaleString()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Workout Types */}
        <div className="card-dark rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏋️</span>
            <p className="text-white font-medium text-sm">شو كان تمرين اليوم؟ (اختر متعدد)</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {WORKOUT_TYPES.map((w) => {
              const selected = workoutTypes.includes(w.id)
              return (
                <motion.button key={w.id} whileTap={{ scale: 0.92 }} onClick={() => toggleWorkout(w.id)}
                  className={`py-2 px-1 rounded-xl text-center transition-all border ${
                    selected ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}>
                  <div className="text-lg">{w.emoji}</div>
                  <div className="text-xs font-medium mt-0.5">{w.label.split(' ')[0]}</div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Cardio */}
        <div className="card-dark rounded-2xl overflow-hidden">
          <button onClick={() => setShowCardio(!showCardio)}
            className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏃</span>
              <div className="text-right">
                <p className="text-white font-medium text-sm">الكارديو</p>
                {cardioType && <p className="text-[#39FF14] text-xs">{cardioType} — {cardioDuration} دقيقة</p>}
              </div>
            </div>
            {showCardio ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          <AnimatePresence>
            {showCardio && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden">
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {CARDIO_TYPES.map((ct) => (
                      <button key={ct} onClick={() => setCardioType(cardioType === ct ? null : ct)}
                        className={`py-2 px-3 rounded-xl text-sm text-right transition-all border ${
                          cardioType === ct ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400'
                        }`}>
                        {ct}
                      </button>
                    ))}
                  </div>

                  {cardioType && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">المدة (بالدقائق)</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setCardioDuration((v) => Math.max(0, v - 5))}
                          className="w-12 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <Input type="number" value={cardioDuration}
                          onChange={(e) => setCardioDuration(Number(e.target.value))}
                          className="flex-1 bg-white/5 border-white/10 text-white text-lg font-bold h-10 text-center" />
                        <button onClick={() => setCardioDuration((v) => v + 5)}
                          className="w-12 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[20, 30, 45, 60].map((m) => (
                          <button key={m} onClick={() => setCardioDuration(m)}
                            className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg py-1.5 text-gray-300 hover:border-white/30">
                            {m}د
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Supplements */}
        <div className="card-dark rounded-2xl overflow-hidden">
          <button onClick={() => setShowSupplements(!showSupplements)}
            className="w-full p-4 flex items-center justify-between">
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
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden">
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {SUPPLEMENTS.map((s) => {
                    const checked = supplementList.includes(s)
                    return (
                      <button key={s} onClick={() => toggleSupplement(s)}
                        className={`py-2.5 px-3 rounded-xl text-sm text-right transition-all border flex items-center gap-2 ${
                          checked ? 'bg-green-500/15 border-green-400/40 text-green-300' : 'bg-white/5 border-white/10 text-gray-400'
                        }`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-green-400' : 'border border-gray-500'}`}>
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

        {/* Save Button */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button onClick={save} disabled={saving}
            className="w-full h-14 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-black text-base rounded-2xl neon-glow">
            {saving ? 'جاري الحفظ...' : '💾 حفظ السجل'}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Check, X, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { DailyLog, WORKOUT_TYPES, CARDIO_TYPES, SUPPLEMENTS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LogPage() {
  const { user } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [log, setLog] = useState<Partial<DailyLog>>({
    calorie_deficit_achieved: false,
    water_goal_achieved: false,
    steps: 0,
    sleep_good: false,
    workout_types: [],
    cardio_type: null,
    cardio_duration: null,
    supplements_taken: false,
    supplement_list: [],
  })
  const [saving, setSaving] = useState(false)
  const [showCardio, setShowCardio] = useState(false)
  const [showSupplements, setShowSupplements] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase.from('daily_logs').select('*')
        .eq('user_id', user.id).eq('log_date', today).single()
      if (data) {
        setLog(data as DailyLog)
        setShowCardio(!!(data as DailyLog).cardio_type)
        setShowSupplements(!!(data as DailyLog).supplements_taken)
      }
    }
    fetch()
  }, [user, today])

  const set = (key: keyof DailyLog, val: unknown) => setLog((prev) => ({ ...prev, [key]: val }))

  const toggleWorkout = (id: string) => {
    const curr = log.workout_types || []
    set('workout_types', curr.includes(id) ? curr.filter((w) => w !== id) : [...curr, id])
  }

  const toggleSupplement = (s: string) => {
    const curr = log.supplement_list || []
    const updated = curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s]
    setLog((prev) => ({ ...prev, supplement_list: updated, supplements_taken: updated.length > 0 }))
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('daily_logs').upsert(
        { ...log, user_id: user.id, log_date: today },
        { onConflict: 'user_id,log_date' }
      )
      if (error) throw error
      toast.success('تم الحفظ! 💪')
    } catch {
      toast.error('خطأ في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const YesNo = ({ label, emoji, value, onChange }: { label: string; emoji: string; value: boolean; onChange: (v: boolean) => void }) => (
    <motion.div whileTap={{ scale: 0.98 }} className="card-dark rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <p className="text-white font-medium text-sm">{label}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onChange(true)}
            className={`w-12 h-10 rounded-xl font-bold text-sm transition-all ${value ? 'bg-[#39FF14] text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
            نعم
          </button>
          <button onClick={() => onChange(false)}
            className={`w-12 h-10 rounded-xl font-bold text-sm transition-all ${!value ? 'bg-red-500/40 text-red-300' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
            لا
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28">
      <div className="px-4 pt-12 pb-4">
        <p className="text-gray-400 text-sm">{format(new Date(), 'EEEE، d MMMM', { locale: ar })}</p>
        <h1 className="text-2xl font-black text-white mt-1">سجل <span className="text-[#39FF14]">يومك</span></h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Yes/No Questions */}
        <YesNo label="حققت عجز سعرات ≥500 عن احتياجك اليومي؟" emoji="🔥"
          value={!!log.calorie_deficit_achieved}
          onChange={(v) => set('calorie_deficit_achieved', v)} />
        <YesNo label="شربت 3 لترات ماء اليوم أو أكثر؟" emoji="💧"
          value={!!log.water_goal_achieved}
          onChange={(v) => set('water_goal_achieved', v)} />
        <YesNo label="نمت منيح أمس؟ (7+ ساعات)" emoji="😴"
          value={!!log.sleep_good}
          onChange={(v) => set('sleep_good', v)} />

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
            <button onClick={() => set('steps', Math.max(0, (log.steps || 0) - 500))}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 relative">
              <Input type="number" value={log.steps || 0}
                onChange={(e) => set('steps', Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white text-xl font-black h-12 text-center" />
            </div>
            <button onClick={() => set('steps', (log.steps || 0) + 500)}
              className="w-12 h-12 rounded-xl bg-[#39FF14]/20 flex items-center justify-center hover:bg-[#39FF14]/30 active:scale-95 transition-all">
              <Plus className="w-4 h-4 text-[#39FF14]" />
            </button>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${Math.min(((log.steps || 0) / 10000) * 100, 100)}%` }}
              className={`h-full rounded-full ${(log.steps || 0) >= 10000 ? 'bg-[#39FF14]' : 'bg-blue-400'}`} />
          </div>
          <p className="text-center text-xs text-gray-500 mt-1">
            {(log.steps || 0) >= 10000 ? '🎉 وصلت الهدف!' : `${Math.max(0, 10000 - (log.steps || 0)).toLocaleString()} خطوة باقية`}
          </p>
          {/* Quick Add */}
          <div className="flex gap-2 mt-3">
            {[1000, 2000, 5000].map((n) => (
              <button key={n} onClick={() => set('steps', Math.min((log.steps || 0) + n, 50000))}
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
              const selected = (log.workout_types || []).includes(w.id)
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
                {log.cardio_type && <p className="text-[#39FF14] text-xs">{log.cardio_type} — {log.cardio_duration} دقيقة</p>}
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
                      <button key={ct} onClick={() => set('cardio_type', log.cardio_type === ct ? null : ct)}
                        className={`py-2 px-3 rounded-xl text-sm text-right transition-all border ${
                          log.cardio_type === ct ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400'
                        }`}>
                        {ct}
                      </button>
                    ))}
                  </div>

                  {log.cardio_type && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">المدة (بالدقائق)</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => set('cardio_duration', Math.max(0, (log.cardio_duration || 0) - 5))}
                          className="w-12 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <Input type="number" value={log.cardio_duration || 0}
                          onChange={(e) => set('cardio_duration', Number(e.target.value))}
                          className="flex-1 bg-white/5 border-white/10 text-white text-lg font-bold h-10 text-center" />
                        <button onClick={() => set('cardio_duration', (log.cardio_duration || 0) + 5)}
                          className="w-12 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[20, 30, 45, 60].map((m) => (
                          <button key={m} onClick={() => set('cardio_duration', m)}
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
                {(log.supplement_list?.length || 0) > 0 && (
                  <p className="text-green-400 text-xs">{log.supplement_list?.length} مكمل</p>
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
                    const checked = (log.supplement_list || []).includes(s)
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

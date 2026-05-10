'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addMonths, format } from 'date-fns'
import { Camera, Scale, Target, Zap, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { CHALLENGE_CRITERIA } from '@/types'
import { toast } from 'sonner'
import Image from 'next/image'

const schema = z.object({
  username: z.string().min(2, 'الاسم قصير'),
  current_weight: z.number().min(30).max(300),
  goal_weight: z.number().min(30).max(300),
  body_fat_percentage: z.number().min(3).max(60).optional(),
  goal_description: z.string().min(3, 'اكتب هدفك'),
  tdee: z.number().min(1200).max(5000),
})
type FormData = z.infer<typeof schema>

const STEPS = [
  { title: 'أهلاً يا بطل!', subtitle: 'من أنت؟', icon: Camera },
  { title: 'قياساتك', subtitle: 'الوضع الحالي', icon: Scale },
  { title: 'هدفك', subtitle: 'شو بدك تحقق؟', icon: Target },
  { title: 'شروط التحدي', subtitle: 'هذا اللي لازم تلتزم فيه', icon: Trophy },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, setProfile } = useStore()
  const [step, setStep] = useState(0)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { current_weight: 0, goal_weight: 0, tdee: 2500 }
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)) }
  }

  const nextStep = async () => {
    let valid = true
    if (step === 0) valid = await trigger('username')
    if (step === 1) valid = await trigger(['current_weight', 'goal_weight', 'tdee'])
    if (step === 2) valid = await trigger('goal_description')
    if (valid && step < STEPS.length - 1) setStep(step + 1)
  }

  const onSubmit = async (values: FormData) => {
    if (!user) return
    setSaving(true)
    try {
      let avatarUrl = null
      if (avatar) {
        const ext = avatar.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        await supabase.storage.from('avatars').upload(path, avatar, { upsert: true })
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = publicUrl
      }

      const startDate = format(new Date(), 'yyyy-MM-dd')
      const endDate = format(addMonths(new Date(), CHALLENGE_CRITERIA.challengeDurationMonths), 'yyyy-MM-dd')

      const { data: profile, error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...values,
        avatar_url: avatarUrl,
        challenge_start_date: startDate,
        challenge_end_date: endDate,
      }).select().single()

      if (error) throw error

      await supabase.from('streaks').upsert({ user_id: user.id, current_streak: 0, longest_streak: 0 })

      setProfile(profile)
      toast.success(`التحدي بدأ! عندك ${CHALLENGE_CRITERIA.challengeDurationMonths} أشهر يا بطل 💪`)
      router.push('/dashboard')
    } catch {
      toast.error('خطأ في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Progress */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-[#39FF14]' : 'bg-white/10'}`} />
          ))}
        </div>
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-gray-400 text-xs">{step + 1} / {STEPS.length}</p>
          <h1 className="text-3xl font-black text-white mt-1">{STEPS[step].title}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{STEPS[step].subtitle}</p>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col px-5">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* Step 0: Profile */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 mt-4">
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer">
                    <div className="w-28 h-28 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden relative hover:border-[#39FF14]/50 transition-all">
                      {avatarPreview
                        ? <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
                        : <><Camera className="w-8 h-8 text-gray-500 mb-1" /><span className="text-xs text-gray-500">صورتك</span></>}
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  <p className="text-gray-500 text-xs mt-2">اضغط لإضافة صورة</p>
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">اسمك / لقبك</Label>
                  <Input {...register('username')} placeholder="مثال: أبو العضل"
                    className="bg-white/5 border-white/10 text-white h-14 text-lg font-bold focus:border-[#39FF14]" />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 1: Measurements */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 mt-4">
                {[
                  { field: 'current_weight' as const, label: 'وزنك الحالي (kg)', placeholder: '85' },
                  { field: 'goal_weight' as const, label: 'وزن الهدف (kg)', placeholder: '75' },
                  { field: 'body_fat_percentage' as const, label: 'نسبة الدهون % (اختياري)', placeholder: '20' },
                  { field: 'tdee' as const, label: 'احتياجك اليومي من السعرات (TDEE)', placeholder: '2500' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <Label className="text-gray-300 mb-1.5 block text-sm">{label}</Label>
                    <Input {...register(field, { valueAsNumber: true })} type="number" placeholder={placeholder}
                      className="bg-white/5 border-white/10 text-white h-12 focus:border-[#39FF14]" />
                    {errors[field] && <p className="text-red-400 text-xs mt-1">{(errors[field] as { message?: string })?.message}</p>}
                  </div>
                ))}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">💡 الـ TDEE هو كمية السعرات اللي جسمك يحتاجها يومياً للحفاظ على وزنه. عجز 500 سعرة = تخسر ~0.5kg أسبوعياً</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Goal */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {['تخفيف الوزن 🔥', 'بناء العضلات 💪', 'تحسين اللياقة 🏃', 'تحدي ابن عمي 😤'].map((g) => (
                    <button type="button" key={g}
                      onClick={() => { const el = document.getElementById('goal_input') as HTMLInputElement; if (el) el.value = g }}
                      className="text-sm bg-white/5 border border-white/10 rounded-xl py-3 px-2 text-gray-300 hover:border-[#39FF14]/50 hover:text-[#39FF14] transition-all text-right">
                      {g}
                    </button>
                  ))}
                </div>
                <div>
                  <Label className="text-gray-300 mb-1.5 block text-sm">هدفك بكلامك</Label>
                  <Input id="goal_input" {...register('goal_description')} placeholder="اكتب هدفك..."
                    className="bg-white/5 border-white/10 text-white h-12 focus:border-[#39FF14]" />
                  {errors.goal_description && <p className="text-red-400 text-xs mt-1">{errors.goal_description.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Challenge Rules (read-only, confirm) */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 mt-4">
                <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-2xl p-4 mb-2">
                  <p className="text-[#39FF14] font-bold text-sm mb-1">مدة التحدي: 4 أشهر</p>
                  <p className="text-gray-400 text-xs">
                    من اليوم {format(new Date(), 'dd/MM/yyyy')} حتى {format(addMonths(new Date(), 4), 'dd/MM/yyyy')}
                  </p>
                </div>
                {[
                  { emoji: '🏋️', title: '4-5 أيام حديد في الأسبوع', sub: 'تمرين قوة منتظم' },
                  { emoji: '🏃', title: '5-7 أيام كارديو في الأسبوع', sub: 'أي نوع كارديو' },
                  { emoji: '👟', title: '10,000 خطوة يومياً كحد أدنى', sub: 'تتبع عبر اليومي' },
                  { emoji: '🔥', title: 'عجز 500 سعرة عن احتياجك اليومي', sub: `احتياجك اليومي يتحدد من الـ TDEE` },
                  { emoji: '💧', title: '3 لترات ماء يومياً كحد أدنى', sub: 'الترطيب الكافي' },
                ].map((rule) => (
                  <div key={rule.title} className="flex items-start gap-3 card-dark rounded-xl p-3">
                    <span className="text-xl flex-shrink-0">{rule.emoji}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{rule.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{rule.sub}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mt-2">
                  <p className="text-yellow-300 text-xs font-medium">⚠️ مقياس الأيام:</p>
                  <p className="text-gray-400 text-xs mt-1">🟢 ≥80% التزام = يوم ممتاز | 🟡 40-79% = تحذير | 🔴 &lt;40% = فشل</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Buttons */}
        <div className="pt-5 pb-24 flex gap-3">
          {step > 0 && (
            <Button type="button" onClick={() => setStep(step - 1)} variant="outline"
              className="flex-1 h-14 border-white/20 text-gray-300 hover:bg-white/5 rounded-2xl">
              <ChevronRight className="w-5 h-5 ml-1" /> السابق
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}
              className="flex-1 h-14 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-bold rounded-2xl neon-glow">
              التالي <ChevronLeft className="w-5 h-5 mr-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={saving}
              className="flex-1 h-14 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-bold rounded-2xl neon-glow">
              {saving ? 'جاري الحفظ...' : '🚀 ابدأ التحدي!'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

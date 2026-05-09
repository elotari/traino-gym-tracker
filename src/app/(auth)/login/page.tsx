'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, ALLOWED_EMAILS } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      toast.error('مش مسموح لك! هذا التطبيق لمجموعة خاصة فقط 🚫')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#39FF14]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mb-4">
              <Dumbbell className="w-10 h-10 text-[#39FF14]" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#39FF14] flex items-center justify-center"
            >
              <Zap className="w-3 h-3 text-black" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            TRAINO
          </h1>
          <p className="text-[#39FF14] text-sm font-medium mt-1 tracking-widest">تحدى نفسك. تحدى ابن عمك.</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111111] border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {isSignUp ? 'إنشاء حساب' : 'مرحباً يا بطل'}
          </h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            {isSignUp ? 'انضم للتحدي' : 'سجل دخولك وابدأ التحدي'}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-300 mb-2 block">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#39FF14] focus:ring-[#39FF14]/20 h-12"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 mb-2 block">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#39FF14] focus:ring-[#39FF14]/20 h-12"
              />
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-bold text-base rounded-xl transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                    جاري التحميل...
                  </span>
                ) : isSignUp ? 'إنشاء الحساب' : 'دخول 💪'}
              </Button>
            </motion.div>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            {isSignUp ? 'عندك حساب؟' : 'ما عندك حساب؟'}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#39FF14] hover:underline font-medium"
            >
              {isSignUp ? 'سجل دخولك' : 'سجل الآن'}
            </button>
          </p>
        </motion.div>

        <p className="text-center text-gray-600 text-xs mt-6">
          خاص بالمتحدين فقط 🏋️
        </p>
      </motion.div>
    </div>
  )
}

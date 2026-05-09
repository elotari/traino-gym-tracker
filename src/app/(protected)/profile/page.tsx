'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Edit2, Target, Scale, Flame, Trophy, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, profile, streak, setProfile } = useStore()
  const [editing, setEditing] = useState(false)
  const [weight, setWeight] = useState(profile?.current_weight?.toString() || '')
  const [goalDesc, setGoalDesc] = useState(profile?.goal_description || '')

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const saveUpdates = async () => {
    if (!user || !profile) return
    const { data, error } = await supabase
      .from('profiles')
      .update({ current_weight: Number(weight), goal_description: goalDesc })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
      setEditing(false)
      toast.success('تم التحديث!')
    }
  }

  const stats = [
    { icon: Flame, label: 'الاستمرارية الحالية', value: `${streak?.current_streak || 0} يوم`, color: '#FB923C' },
    { icon: Trophy, label: 'أطول استمرارية', value: `${streak?.longest_streak || 0} يوم`, color: '#F59E0B' },
    { icon: Scale, label: 'الوزن الحالي', value: `${profile?.current_weight || '--'} kg`, color: '#38BDF8' },
    { icon: Target, label: 'وزن الهدف', value: `${profile?.goal_weight || '--'} kg`, color: '#39FF14' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black text-white">
          حسابي <span className="text-[#39FF14]">👤</span>
        </h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-dark rounded-2xl p-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent" />
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-3xl mx-auto mb-4 overflow-hidden bg-white/10 flex items-center justify-center border-2 border-[#39FF14]/30">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="avatar" width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h2 className="text-2xl font-black text-white">{profile?.username || 'بطل'}</h2>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
            {profile?.goal_description && (
              <p className="text-[#39FF14] text-sm mt-2 font-medium">🎯 {profile.goal_description}</p>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-dark rounded-2xl p-4"
            >
              <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Edit Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-dark rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">تحديث البيانات</h3>
            <button
              onClick={() => setEditing(!editing)}
              className="text-[#39FF14] flex items-center gap-1 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              {editing ? 'إلغاء' : 'تعديل'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">الوزن الحالي (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">هدفك</Label>
                <Input
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11"
                />
              </div>
              <Button onClick={saveUpdates} className="w-full bg-[#39FF14] text-black font-bold h-11 rounded-xl">
                حفظ التغييرات
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">الوزن الحالي</span>
                <span className="text-white font-medium">{profile?.current_weight || '--'} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">نسبة الدهون</span>
                <span className="text-white font-medium">{profile?.body_fat_percentage || '--'}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">TDEE يومي</span>
                <span className="text-white font-medium">{profile?.tdee || '--'} سعرة</span>
              </div>
              {profile?.challenge_end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">نهاية التحدي</span>
                  <span className="text-white font-medium">{profile.challenge_end_date}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Onboarding Link */}
        <Link href="/onboarding">
          <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:bg-white/5 h-12 rounded-xl">
            إعادة الإعداد الأولي
          </Button>
        </Link>

        {/* Logout */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 h-12 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            تسجيل الخروج
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { Profile } from '@/types'

const PUBLIC_PATHS = ['/login']
const PROTECTED_PATHS = ['/dashboard', '/log', '/competition', '/onboarding', '/profile']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setStreak, setLoading } = useStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', userId).single()
      if (profile) setProfile(profile as Profile)

      const { data: streak } = await supabase
        .from('streaks').select('*').eq('user_id', userId).single()
      if (streak) setStreak(streak)
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
        if (isPublic) router.replace('/dashboard')
      } else {
        if (isProtected) router.replace('/login')
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
        router.push('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setStreak(null)
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, setUser, setProfile, setStreak, setLoading, router])

  return <>{children}</>
}

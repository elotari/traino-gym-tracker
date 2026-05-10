import { create } from 'zustand'
import { Profile, DailyLog, Streak } from '@/types'
import { User } from '@supabase/supabase-js'

interface AppState {
  user: User | null
  profile: Profile | null
  todayLog: DailyLog | null
  streak: Streak | null
  isLoading: boolean
  logsSavedAt: number
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setTodayLog: (log: DailyLog | null) => void
  setStreak: (streak: Streak | null) => void
  setLoading: (loading: boolean) => void
  markLogSaved: () => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  todayLog: null,
  streak: null,
  isLoading: true,
  logsSavedAt: 0,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setTodayLog: (log) => set({ todayLog: log }),
  setStreak: (streak) => set({ streak }),
  setLoading: (loading) => set({ isLoading: loading }),
  markLogSaved: () => set({ logsSavedAt: Date.now() }),
}))

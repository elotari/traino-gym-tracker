import { createClient } from '@supabase/supabase-js'

// Use placeholders during build; actual values used at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const ALLOWED_EMAILS = [
  process.env.NEXT_PUBLIC_USER1_EMAIL || '',
  process.env.NEXT_PUBLIC_USER2_EMAIL || '',
].filter(Boolean)

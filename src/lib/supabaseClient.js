import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Copy .env.example to .env and fill your keys.')
}

export const supabase = createClient(supabaseUrl || 'https://demo.supabase.co', supabaseAnonKey || 'demo-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

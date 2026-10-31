import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

let parsedSupabaseUrl

try {
  parsedSupabaseUrl = new URL(supabaseUrl)
} catch {
  throw new Error('VITE_SUPABASE_URL must be a valid URL.')
}

const isLocalDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(
  parsedSupabaseUrl.hostname,
)

if (parsedSupabaseUrl.protocol !== 'https:' && !isLocalDevelopmentHost) {
  throw new Error('Supabase must use HTTPS outside local development.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
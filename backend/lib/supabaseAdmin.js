import { createClient } from '@supabase/supabase-js'

let supabaseAdmin = null

export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabaseAdmin
}
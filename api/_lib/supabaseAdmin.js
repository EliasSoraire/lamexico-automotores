import { createClient } from '@supabase/supabase-js'

// Este cliente usa la service_role key: SOLO se usa del lado del servidor (carpeta /api).
// Nunca debe exponerse al frontend.
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

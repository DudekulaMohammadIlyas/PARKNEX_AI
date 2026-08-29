import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ustmjxihbaaizxtwvwue.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LHcZB1n_Ay9la_ggNq97CA_RiBRZswY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Copy web-app/.env.example to web-app/.env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

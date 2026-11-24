// Blush & Basics — Supabase client configuration
// Replace both placeholders with your Supabase Project URL and Publishable key.
// Never put a service_role/secret key in this browser-side file.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://qxzfuerehshrmkkimpig.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xCkh1BC2gW4F8oM6S9A4TQ_BEi3M6Rr';

export const isSupabaseConfigured =
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('PASTE_YOUR_');

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

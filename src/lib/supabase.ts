import { createClient } from '@supabase/supabase-js';

// The anon key is public by design (it is already shipped in the app and the
// OTP viewer). Everything the admin panel can do is enforced by RLS +
// public.is_admin() on the signed-in user's session, never by this key.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bdsaakhxumazaxigqchm.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2Fha2h4dW1hemF4aWdxY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzYxMjYsImV4cCI6MjA4MzI1MjEyNn0.zlidJunY3hQDQrj2hJfvwM3GSh6wTCUwRxIh_DjhXV4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storageKey: 'icopedia-admin-auth', persistSession: true, autoRefreshToken: true },
});

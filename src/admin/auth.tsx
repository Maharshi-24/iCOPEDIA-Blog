import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Profile = { id: string; full_name: string | null; phone_no: string | null; app_role: string };

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const resolve = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    // is_admin() is the same check every RLS policy uses, so the UI can't
    // disagree with what the database will actually allow.
    const [{ data: admin }, { data: me }] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase.from('user_profiles').select('id, full_name, phone_no, app_role').eq('id', next.user.id).maybeSingle(),
    ]);
    setIsAdmin(admin === true);
    setProfile(me as Profile | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Token refreshes don't change who is signed in; skip the extra round trip.
      if (event === 'TOKEN_REFRESHED') {
        setSession(next);
        return;
      }
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(() => resolve(next), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, profile, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth outside AdminAuthProvider');
  return ctx;
}

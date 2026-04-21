import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type UserType = 'angestellt' | 'selbststaendig' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  userType: UserType;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUserType: (type: UserType) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  userType: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  setUserType: (userType) => set({ userType }),
  signOut: async () => {
    set({ session: null, user: null, userType: null });
    try {
      await supabase.auth.signOut();
    } catch {}
  },
}));

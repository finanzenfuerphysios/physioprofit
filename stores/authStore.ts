import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

type UserType = 'angestellt' | 'selbststaendig' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  userType: UserType;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUserType: (type: UserType) => Promise<void>;
  loadUserType: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  userType: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  setUserType: async (userType) => {
    set({ userType });
    if (userType) {
      await SecureStore.setItemAsync('user_type', userType);
    } else {
      await SecureStore.deleteItemAsync('user_type');
    }
  },
  loadUserType: async (userId) => {
    // Lokal zuerst (schnell)
    const local = (await SecureStore.getItemAsync('user_type')) as UserType | null;
    if (local) set({ userType: local });

    // Supabase im Hintergrund (non-blocking, 3s timeout)
    try {
      const timeout = new Promise<any>((resolve) => setTimeout(() => resolve({ data: null }), 3000));
      const req = supabase.from('profiles').select('user_type').eq('id', userId).maybeSingle();
      const { data } = (await Promise.race([req, timeout])) as any;
      if (data?.user_type) {
        set({ userType: data.user_type });
        await SecureStore.setItemAsync('user_type', data.user_type);
      }
    } catch {}
  },
  signOut: async () => {
    set({ session: null, user: null, userType: null });
    await SecureStore.deleteItemAsync('user_type');
    try {
      await supabase.auth.signOut();
    } catch {}
  },
}));

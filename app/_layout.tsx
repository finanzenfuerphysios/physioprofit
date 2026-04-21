import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { session, userType, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuth) {
      router.replace('/auth/login');
    } else if (session && !userType && !inOnboarding) {
      router.replace('/onboarding/usertype');
    } else if (session && userType && (inAuth || inOnboarding)) {
      router.replace('/tabs/dashboard');
    }
  }, [session, userType, loading, segments]);

  return null;
}

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const timeout = new Promise<any>((resolve) => setTimeout(() => resolve({ data: { session: null } }), 5000));
        const req = supabase.auth.getSession();
        const { data: { session } } = (await Promise.race([req, timeout])) as any;
        setSession(session ?? null);
        if (session) useAuthStore.getState().loadUserType(session.user.id);
      } catch {
        setSession(null);
      }
    };
    loadInitial();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        useAuthStore.getState().loadUserType(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="onboarding/usertype" />
        <Stack.Screen name="tabs/dashboard" />
        <Stack.Screen name="tabs/einnahmen" />
        <Stack.Screen name="tabs/ausgaben" />
        <Stack.Screen name="tabs/quiz" />
        <Stack.Screen name="tabs/praxis" />
      </Stack>
    </>
  );
}

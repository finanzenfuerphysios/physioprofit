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
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        if (data?.user_type) useAuthStore.getState().setUserType(data.user_type);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <NavigationGuard />
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="onboarding/usertype" />
      <Stack.Screen name="tabs/dashboard" />
    </Stack>
  );
}

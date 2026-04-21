import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="onboarding/usertype" />
      <Stack.Screen name="tabs/dashboard" />
    </Stack>
  );
}

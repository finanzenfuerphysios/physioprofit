import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { session, userType } = useAuthStore();

  if (!session) return <Redirect href="/auth/login" />;
  if (!userType) return <Redirect href="/onboarding/usertype" />;
  return <Redirect href="/tabs/dashboard" />;
}

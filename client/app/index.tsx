import { useAuth } from '@/components/auth/authService';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}

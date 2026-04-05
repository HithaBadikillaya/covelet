import { useAuth } from '@/components/auth/authService';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Logged-in → go directly to Dashboard
  // Not logged in → show Login/Landing page
  return <Redirect href={user ? '/(tabs)/dashboard' : '/login'} />;
}

import { useAuth } from "@/components/auth/authService";
import { Redirect } from "expo-router";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Manual redirect fallback for index route if AuthGate is slow
  return <Redirect href={user ? "/(tabs)/dashboard" : "/login"} />;
}

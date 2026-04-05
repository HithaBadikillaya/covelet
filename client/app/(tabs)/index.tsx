import { Redirect } from 'expo-router';

// The (tabs) root index just redirects straight to the dashboard.
// HomeScreen has been removed from the main navigation flow.
export default function TabIndex() {
  return <Redirect href="/(tabs)/dashboard" />;
}

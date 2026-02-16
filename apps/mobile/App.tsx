import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './src/screens/AuthScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import type { User } from './src/types';
import { getApiBase } from './src/lib/api';

const API_BASE = getApiBase();

export type RootStackParamList = {
  Auth: undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await AsyncStorage.getItem('bt_token');
      if (!stored) {
        setBooting(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setToken(stored);
      } catch {
        await AsyncStorage.removeItem('bt_token');
      } finally {
        setBooting(false);
      }
    };
    bootstrap();
  }, []);

  const handleAuthSuccess = async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem('bt_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    await AsyncStorage.removeItem('bt_token');
    setToken(null);
    setUser(null);
  };

  if (booting) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token || !user ? (
          <Stack.Screen name="Auth">
            {() => <AuthScreen onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Projects">
              {({ navigation }) => (
                <ProjectsScreen
                  token={token}
                  onLogout={handleLogout}
                  onSelectProject={(id) => navigation.navigate('ProjectDetail', { projectId: id })}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ProjectDetail">
              {({ route, navigation }) => (
                <ProjectDetailScreen
                  token={token}
                  projectId={route.params.projectId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

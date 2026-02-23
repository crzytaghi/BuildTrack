import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthScreen from "./src/screens/AuthScreen";
import CompanySetupScreen from "./src/screens/CompanySetupScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import ProjectDetailScreen from "./src/screens/ProjectDetailScreen";
import TasksScreen from "./src/screens/TasksScreen";
import PlaceholderScreen from "./src/screens/PlaceholderScreen";
import type { User } from "./src/types";
import { getApiBase } from "./src/lib/api";

const API_BASE = getApiBase();

export type RootStackParamList = {
  Auth: undefined;
  CompanySetup: undefined;
  Dashboard: undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string };
  Tasks: undefined;
  Budget: undefined;
  Expenses: undefined;
  Documents: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companySetupRequired, setCompanySetupRequired] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await AsyncStorage.getItem("bt_token");
      if (!stored) {
        setBooting(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (!res.ok) throw new Error("Session expired");
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setToken(stored);
        const companyRes = await fetch(`${API_BASE}/company/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (companyRes.ok) {
          const companyData = (await companyRes.json()) as {
            company: { name: string; companySetupComplete: boolean } | null;
          };
          if (companyData.company?.companySetupComplete) {
            setCompanyName(companyData.company.name);
            setCompanySetupRequired(false);
          } else {
            setCompanySetupRequired(true);
          }
        }
      } catch {
        await AsyncStorage.removeItem("bt_token");
      } finally {
        setBooting(false);
      }
    };
    bootstrap();
  }, []);

  const handleAuthSuccess = async (
    newToken: string,
    newUser: User,
    fromSignup: boolean,
  ) => {
    await AsyncStorage.setItem("bt_token", newToken);
    setToken(newToken);
    setUser(newUser);
    if (fromSignup) {
      setCompanySetupRequired(true);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    await AsyncStorage.removeItem("bt_token");
    setToken(null);
    setUser(null);
    setCompanyName(null);
    setCompanySetupRequired(false);
  };

  const handleNavigate = (
    navigation: NativeStackNavigationProp<RootStackParamList>,
    route: string,
  ) => {
    if (route === "Dashboard" || route === "Projects") {
      navigation.navigate(route);
    }
    if (
      route === "Tasks" ||
      route === "Budget" ||
      route === "Expenses" ||
      route === "Documents" ||
      route === "Reports" ||
      route === "Settings"
    ) {
      navigation.navigate(route);
    }
  };

  if (booting) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token || !user ? (
          <Stack.Screen name="Auth">
            {() => <AuthScreen onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : companySetupRequired ? (
          <Stack.Screen name="CompanySetup">
            {() => (
              <CompanySetupScreen
                onSubmit={async (name) => {
                  const res = await fetch(`${API_BASE}/company/setup`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name }),
                  });
                  if (!res.ok) return;
                  const data = (await res.json()) as {
                    company: { name: string; companySetupComplete: boolean };
                  };
                  setCompanyName(data.company.name);
                  setCompanySetupRequired(false);
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Dashboard">
              {({ navigation }) => (
                <DashboardScreen
                  companyName={companyName ?? "Company"}
                  onGoProjects={() => navigation.navigate("Projects")}
                  onLogout={handleLogout}
                  onNavigate={(route) => handleNavigate(navigation, route)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Projects">
              {({ navigation }) => (
                <ProjectsScreen
                  token={token}
                  onLogout={handleLogout}
                  onSelectProject={(id) =>
                    navigation.navigate("ProjectDetail", { projectId: id })
                  }
                  onNavigate={(route) => handleNavigate(navigation, route)}
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
            <Stack.Screen name="Tasks">
              {({ navigation }) => (
                <TasksScreen
                  token={token}
                  onLogout={handleLogout}
                  onNavigate={(route) => handleNavigate(navigation, route)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Budget">
              {({ navigation }) => (
                <PlaceholderScreen
                  title="Budget"
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Expenses">
              {({ navigation }) => (
                <PlaceholderScreen
                  title="Expenses"
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Documents">
              {({ navigation }) => (
                <PlaceholderScreen
                  title="Documents"
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Reports">
              {({ navigation }) => (
                <PlaceholderScreen
                  title="Reports"
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {({ navigation }) => (
                <PlaceholderScreen
                  title="Settings"
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

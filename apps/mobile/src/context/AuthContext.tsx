import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../lib/api';
import type { User } from '../types';

const API_BASE = getApiBase();

type AuthState = {
  token: string | null;
  user: User | null;
  companyName: string | null;
  companySetupRequired: boolean;
  booting: boolean;
};

type AuthContextValue = AuthState & {
  handleAuthSuccess: (token: string, user: User, fromSignup: boolean) => Promise<void>;
  handleCompanySetup: (name: string) => void;
  handleLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    companyName: null,
    companySetupRequired: false,
    booting: true,
  });

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await AsyncStorage.getItem('bt_token');
      if (!stored) {
        setState((s) => ({ ...s, booting: false }));
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = (await res.json()) as { user: User };

        const companyRes = await fetch(`${API_BASE}/company/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        let companyName: string | null = null;
        let companySetupRequired = false;
        if (companyRes.ok) {
          const companyData = (await companyRes.json()) as {
            company: { name: string; companySetupComplete: boolean } | null;
          };
          if (companyData.company?.companySetupComplete) {
            companyName = companyData.company.name;
          } else {
            companySetupRequired = true;
          }
        }

        setState({ token: stored, user: data.user, companyName, companySetupRequired, booting: false });
      } catch {
        await AsyncStorage.removeItem('bt_token');
        setState((s) => ({ ...s, booting: false }));
      }
    };
    bootstrap();
  }, []);

  const handleAuthSuccess = async (newToken: string, newUser: User, fromSignup: boolean) => {
    await AsyncStorage.setItem('bt_token', newToken);
    setState((s) => ({
      ...s,
      token: newToken,
      user: newUser,
      companySetupRequired: fromSignup,
    }));
  };

  const handleCompanySetup = (name: string) => {
    setState((s) => ({ ...s, companyName: name, companySetupRequired: false }));
  };

  const handleLogout = async () => {
    if (state.token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
      }).catch(() => null);
    }
    await AsyncStorage.removeItem('bt_token');
    setState({ token: null, user: null, companyName: null, companySetupRequired: false, booting: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, handleAuthSuccess, handleCompanySetup, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

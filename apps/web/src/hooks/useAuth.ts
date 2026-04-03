import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { User } from '../types/projects';

const API_BASE = getApiBase();

const getStoredToken = () => localStorage.getItem('bt_token');

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companySetupRequired, setCompanySetupRequired] = useState(false);

  useEffect(() => {
    const init = async () => {
      const currentToken = getStoredToken();
      if (!currentToken) { setAuthLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setToken(currentToken);
        const companyRes = await fetch(`${API_BASE}/company/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
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
        localStorage.removeItem('bt_token');
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  const handleAuth = async (path: 'login' | 'signup', payload: Record<string, string>) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid credentials');
        if (res.status === 409) throw new Error('Email already in use');
        throw new Error((data as { error?: string }).error ?? 'Authentication failed');
      }
      const data = (await res.json()) as { token: string; user: User };
      localStorage.setItem('bt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (path === 'signup') setCompanySetupRequired(true);
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Unable to reach the API. Is it running on port 4000?');
      }
      throw err;
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    localStorage.removeItem('bt_token');
    setUser(null);
    setToken(null);
  };

  const handleCompanySetup = async (name: string) => {
    const res = await fetch(`${API_BASE}/company/setup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { company: { name: string; companySetupComplete: boolean } };
    setCompanyName(data.company.name);
    setCompanySetupRequired(false);
  };

  return {
    user, token, authLoading,
    authView, setAuthView,
    error, setError,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    signupName, setSignupName,
    signupEmail, setSignupEmail,
    signupPassword, setSignupPassword,
    signupConfirmPassword, setSignupConfirmPassword,
    companyName, companySetupRequired,
    handleAuth, handleLogout, handleCompanySetup,
  };
};

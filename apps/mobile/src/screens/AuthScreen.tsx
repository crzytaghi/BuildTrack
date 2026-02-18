import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBase } from '../lib/api';
import type { AuthResponse, User } from '../types';

const API_BASE = getApiBase();

type Props = {
  onAuthSuccess: (token: string, user: User, fromSignup: boolean) => void;
};

const AuthScreen = ({ onAuthSuccess }: Props) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      if (view === 'signup' && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const payload = view === 'signup' ? { name, email, password } : { email, password };
      const res = await fetch(`${API_BASE}/auth/${view}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid credentials');
        if (res.status === 409) throw new Error('Email already in use');
        throw new Error(data.error ?? 'Authentication failed');
      }
      const data = (await res.json()) as AuthResponse;
      onAuthSuccess(data.token, data.user, view === 'signup');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1118' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '700' }}>BuildTrack</Text>
      <Text style={{ color: '#94a3b8', marginTop: 6 }}>Sign in to manage projects.</Text>

      <View style={{ flexDirection: 'row', marginTop: 24, backgroundColor: '#111827', borderRadius: 999 }}>
        {(['login', 'signup'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setView(tab);
              setError(null);
              setName('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              backgroundColor: view === tab ? '#0ea5e9' : 'transparent',
              borderRadius: 999,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: view === tab ? '#0f172a' : '#cbd5f5', fontWeight: '600' }}>
              {tab === 'login' ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={{ marginTop: 16, backgroundColor: '#7f1d1d', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fecaca' }}>{error}</Text>
        </View>
      )}

      {view === 'signup' && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor="#64748b"
          style={{ marginTop: 20, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
        />
      )}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        style={{ marginTop: 16, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#64748b"
        secureTextEntry
        style={{ marginTop: 16, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
      />
      {view === 'signup' && (
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor="#64748b"
          secureTextEntry
          style={{ marginTop: 16, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
        />
      )}

      <TouchableOpacity
        onPress={submit}
        style={{ marginTop: 20, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#0f172a', fontWeight: '700' }}>
          {view === 'login' ? 'Login' : 'Create Account'}
        </Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;

import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getApiBase } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = getApiBase();

const CompanySetupScreen = () => {
  const { token, handleCompanySetup } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/company/setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Unable to save company');
      const data = (await res.json()) as { company: { name: string } };
      handleCompanySetup(data.company.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1118' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700' }}>Set Up Your Company</Text>
        <Text style={{ color: '#94a3b8', marginTop: 8 }}>
          Enter your company name to get started.
        </Text>

        {error && (
          <View style={{ marginTop: 16, backgroundColor: '#7f1d1d', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fecaca' }}>{error}</Text>
          </View>
        )}

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Company name"
          placeholderTextColor="#64748b"
          style={{ marginTop: 16, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
        />

        <TouchableOpacity
          onPress={submit}
          style={{ marginTop: 16, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#0f172a', fontWeight: '700' }}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CompanySetupScreen;

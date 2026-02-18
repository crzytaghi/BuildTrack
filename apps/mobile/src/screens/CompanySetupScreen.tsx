import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const CompanySetupScreen = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1118' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700' }}>Set Up Your Company</Text>
        <Text style={{ color: '#94a3b8', marginTop: 8 }}>
          Placeholder for MVP. Company name stored locally for now.
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
          onPress={() => {
            if (!name.trim()) {
              setError('Company name is required');
              return;
            }
            setError(null);
            onSubmit(name.trim());
          }}
          style={{ marginTop: 16, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#0f172a', fontWeight: '700' }}>Save & Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CompanySetupScreen;

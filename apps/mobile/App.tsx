import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

const styles = {
  screen: { flex: 1, backgroundColor: '#0b1118', padding: 20 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 16 },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 16, marginBottom: 12 },
  label: { color: '#94a3b8', fontSize: 12 },
  value: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginTop: 6 },
};

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>BuildTrack</Text>
        <Text style={styles.subtitle}>Project overview</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Active Project</Text>
          <Text style={styles.value}>Maple St</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.card, { flex: 1 }]}> 
            <Text style={styles.label}>Actual</Text>
            <Text style={styles.value}>$218k</Text>
          </View>
          <View style={[styles.card, { flex: 1 }]}> 
            <Text style={styles.label}>Variance</Text>
            <Text style={[styles.value, { color: '#22c55e' }]}>$202k</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: '#0f172a' }]}> 
          <Text style={[styles.label, { marginBottom: 8 }]}>Tasks Due Soon</Text>
          {['Foundation pour', 'Framing begins', 'Roofing delivery'].map((t) => (
            <View key={t} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1f2937' }}>
              <Text style={{ color: '#e2e8f0', fontWeight: '600' }}>{t}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Due Feb 14</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: '#0f172a' }]}> 
          <Text style={[styles.label, { marginBottom: 8 }]}>Recent Expenses</Text>
          {['Concrete Supply', 'Riverstone Lumber', 'Peak Electrical'].map((t) => (
            <View key={t} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1f2937' }}>
              <Text style={{ color: '#e2e8f0', fontWeight: '600' }}>{t}</Text>
              <Text style={{ color: '#f97316', fontSize: 12 }}>-$12,480</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

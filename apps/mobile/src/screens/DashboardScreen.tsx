import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SlideMenu, { MenuItem } from '../components/SlideMenu';

type Props = {
  companyName: string;
  onGoProjects: () => void;
  onLogout: () => void;
  onNavigate: (route: string) => void;
};

const DashboardScreen = ({ companyName, onGoProjects, onLogout, onNavigate }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const items: MenuItem[] = [
    { label: 'Dashboard', onPress: () => onNavigate('Dashboard') },
    { label: 'Projects', onPress: () => onNavigate('Projects') },
    { label: 'Tasks', onPress: () => onNavigate('Tasks') },
    { label: 'Budget', onPress: () => onNavigate('Budget') },
    { label: 'Expenses', onPress: () => onNavigate('Expenses') },
    { label: 'Documents', onPress: () => onNavigate('Documents') },
    { label: 'Reports', onPress: () => onNavigate('Reports') },
    { label: 'Settings', onPress: () => onNavigate('Settings') },
    { label: 'Log out', onPress: onLogout },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1118' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700' }}>Dashboard</Text>
            <Text style={{ color: '#94a3b8', marginTop: 4 }}>{companyName}</Text>
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(true)}>
            <Text style={{ color: '#e2e8f0', fontSize: 20 }}>☰</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#94a3b8', marginTop: 10 }}>Project overview</Text>

        <View style={{ marginTop: 20, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
          <Text style={{ color: '#e2e8f0' }}>KPIs</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#111827', padding: 12, borderRadius: 12 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Total Budget</Text>
              <Text style={{ color: '#f8fafc', fontWeight: '700' }}>$1.42M</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#111827', padding: 12, borderRadius: 12 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Actual Spend</Text>
              <Text style={{ color: '#f8fafc', fontWeight: '700' }}>$620k</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
          <Text style={{ color: '#e2e8f0' }}>Tasks Due Soon</Text>
          {['Foundation pour', 'Framing begins', 'Roofing delivery'].map((task) => (
            <Text key={task} style={{ color: '#94a3b8', marginTop: 8 }}>
              {task}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          onPress={onGoProjects}
          style={{ marginTop: 24, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#0f172a', fontWeight: '700' }}>View Projects</Text>
        </TouchableOpacity>
      </View>
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} items={items} />
    </SafeAreaView>
  );
};

export default DashboardScreen;

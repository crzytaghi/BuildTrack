import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PlaceholderScreen = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1118' }} edges={['top', 'bottom']}>
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
        This route is under construction. Check back later for updates.
      </Text>
      <TouchableOpacity
        onPress={onBack}
        style={{ marginTop: 24, alignSelf: 'center', backgroundColor: '#0ea5e9', padding: 12, borderRadius: 12 }}
      >
        <Text style={{ color: '#0f172a', fontWeight: '700' }}>Back</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

export default PlaceholderScreen;

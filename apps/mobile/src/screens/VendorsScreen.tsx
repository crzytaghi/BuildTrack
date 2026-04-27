import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '../theme';

const VendorsScreen = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
    <View style={{ padding: spacing.xl }}>
      <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.sm }}>
        Vendors
      </Text>
      <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginTop: spacing.lg }}>
        <Text style={{ color: colors.textLabel, marginBottom: spacing.sm }}>Coming in Sprint 4</Text>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
          Vendor list, contact details, and per-vendor spend summary will be available here.
        </Text>
      </View>
    </View>
  </SafeAreaView>
);

export default VendorsScreen;

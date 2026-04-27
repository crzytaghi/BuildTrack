import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';

const DashboardScreen = () => {
  const { companyName } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }}>
            Dashboard
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
            {companyName ?? 'My Company'}
          </Text>
        </View>

        {/* KPI placeholder */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textLabel, marginBottom: spacing.md }}>Overview</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1, backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Total Budget</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>—</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Actual Spend</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>—</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <View style={{ flex: 1, backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Active Projects</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>—</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Variance</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>—</Text>
            </View>
          </View>
        </View>

        {/* Tasks due soon placeholder */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textLabel, marginBottom: spacing.sm }}>Tasks Due Soon</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            Live data coming in Sprint 2
          </Text>
        </View>

        {/* Recent expenses placeholder */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textLabel, marginBottom: spacing.sm }}>Recent Expenses</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            Live data coming in Sprint 2
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

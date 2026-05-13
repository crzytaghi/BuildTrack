import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, companyName, handleLogout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <View style={{ padding: spacing.xl }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.link, fontSize: fontSize.sm }}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.xl }}>
          Settings
        </Text>

        {/* Account info */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Account</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{user?.name ?? '—'}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>{user?.email ?? '—'}</Text>
        </View>

        {/* Company info */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Company</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{companyName ?? '—'}</Text>
        </View>

        {/* Placeholder for future settings */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.xl }}>
          <Text style={{ color: colors.textLabel, marginBottom: spacing.sm }}>More settings coming in Sprint 5</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            Company editing, notification preferences, and account management will be available here.
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: colors.errorBg, padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' }}
        >
          <Text style={{ color: colors.errorText, fontWeight: '700' }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

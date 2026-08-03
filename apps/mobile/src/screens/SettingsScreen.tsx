import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../lib/api';
import { colors, spacing, radius, fontSize } from '../theme';

const API_BASE = getApiBase();

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, companyName, token, handleLogout } = useAuth();

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async () => {
    setPwError(null);
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return; }
    if (pwForm.next.length < 8) { setPwError('Must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(pwForm.next)) { setPwError('Must contain an uppercase letter'); return; }
    if (!/[0-9]/.test(pwForm.next)) { setPwError('Must contain a number'); return; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwForm.next)) { setPwError('Must contain a special character'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (res.status === 401) { setPwError('Current password is incorrect'); return; }
      if (!res.ok) throw new Error();
      setPwForm({ current: '', next: '', confirm: '' });
      setPwOpen(false);
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwError('Unable to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
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

        {/* Change password */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: pwOpen ? spacing.md : 0 }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Password</Text>
            {!pwOpen && (
              <TouchableOpacity onPress={() => { setPwOpen(true); setPwError(null); }}>
                <Text style={{ color: colors.link, fontSize: fontSize.sm }}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {pwSuccess && (
            <View style={{ backgroundColor: colors.successBg, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm }}>
              <Text style={{ color: colors.successText, fontSize: fontSize.sm }}>Password updated successfully.</Text>
            </View>
          )}

          {pwOpen && (
            <>
              {pwError && (
                <View style={{ backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm }}>
                  <Text style={{ color: colors.errorText, fontSize: fontSize.sm }}>{pwError}</Text>
                </View>
              )}
              {(['current', 'next', 'confirm'] as const).map((field) => (
                <TextInput
                  key={field}
                  secureTextEntry
                  placeholder={field === 'current' ? 'Current password' : field === 'next' ? 'New password' : 'Confirm new password'}
                  placeholderTextColor={colors.textMuted}
                  value={pwForm[field]}
                  onChangeText={(v) => setPwForm((p) => ({ ...p, [field]: v }))}
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm }}
                />
              ))}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={pwSaving}
                  style={{ flex: 1, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', opacity: pwSaving ? 0.5 : 1 }}
                >
                  <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{pwSaving ? 'Saving...' : 'Update'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setPwOpen(false); setPwForm({ current: '', next: '', confirm: '' }); setPwError(null); }}
                  style={{ flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: colors.textLabel }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: colors.errorBg, padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' }}
        >
          <Text style={{ color: colors.errorText, fontWeight: '700' }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

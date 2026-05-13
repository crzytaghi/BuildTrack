import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useVendors } from '../hooks/useVendors';
import { colors, fontSize, radius, spacing } from '../theme';

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k` : `$${n.toLocaleString()}`;

const VendorsScreen = () => {
  const { token } = useAuth();
  const { vendors, loading, refreshing, error, refresh } = useVendors(token ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }}>Vendors</Text>
      </View>

      {error && (
        <View style={{ marginHorizontal: spacing.xl, backgroundColor: colors.errorBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.errorText, fontSize: fontSize.sm, flex: 1 }}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={{ color: colors.errorText, fontWeight: '700', fontSize: fontSize.sm }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            {loading ? 'Loading...' : 'No vendors found.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: fontSize.md }}>{item.name}</Text>
                {item.trade && (
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>{item.trade}</Text>
                )}
                {item.contactName && (
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>{item.contactName}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.warningText, fontWeight: '700' }}>{fmt(item.totalSpend)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>
                  {item.expenseCount} expense{item.expenseCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default VendorsScreen;

import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useExpenses, filterByProject, filterByDateRange } from '../hooks/useExpenses';
import PickerModal from '../components/PickerModal';
import { colors, fontSize, radius, spacing } from '../theme';
import type { ExpenseItem } from '../types';

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseDate = (v?: string) => { const p = new Date(v ?? ''); return Number.isNaN(p.getTime()) ? new Date() : p; };

type ActivePicker = 'project' | 'startDate' | 'endDate' | null;

const ExpensesScreen = () => {
  const { token } = useAuth();
  const { data, loading, refreshing, error, refresh } = useExpenses(token ?? '');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const vendorMap = Object.fromEntries((data?.vendors ?? []).map((v) => [v.id, v.name]));
  const projectMap = Object.fromEntries((data?.projects ?? []).map((p) => [p.id, p.name]));

  const filtered = (() => {
    let list: ExpenseItem[] = data?.expenses ?? [];
    if (projectId) list = filterByProject(list, projectId);
    if (startDate || endDate) list = filterByDateRange(list, startDate, endDate);
    return list.slice().sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  })();

  const projectOptions = [
    { id: '', label: 'All Projects' },
    ...(data?.projects ?? []).map((p) => ({ id: p.id, label: p.name })),
  ];

  const activeProject = projectId ? projectMap[projectId] : 'All Projects';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }}>Expenses</Text>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => setActivePicker('project')}
          style={{ backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <Text style={{ color: projectId ? colors.textPrimary : colors.textSecondary, fontSize: fontSize.sm }}>{activeProject}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>▾</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setActivePicker('startDate')}
            style={{ flex: 1, backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle }}
          >
            <Text style={{ color: startDate ? colors.textPrimary : colors.textMuted, fontSize: fontSize.sm }}>
              {startDate || 'From date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActivePicker('endDate')}
            style={{ flex: 1, backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle }}
          >
            <Text style={{ color: endDate ? colors.textPrimary : colors.textMuted, fontSize: fontSize.sm }}>
              {endDate || 'To date'}
            </Text>
          </TouchableOpacity>
          {(startDate || endDate || projectId) && (
            <TouchableOpacity
              onPress={() => { setProjectId(''); setStartDate(''); setEndDate(''); }}
              style={{ backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle }}
            >
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={{ marginHorizontal: spacing.xl, backgroundColor: colors.errorBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm }}>
          <Text style={{ color: colors.errorText, fontSize: fontSize.sm }}>{error}</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            {loading ? 'Loading...' : 'No expenses found.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1, marginRight: spacing.sm }} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={{ color: colors.warningText, fontWeight: '700' }}>${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
              {vendorMap[item.vendorId] ?? 'Unknown vendor'} · {projectMap[item.projectId] ?? 'Unknown project'}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>{item.expenseDate}</Text>
          </View>
        )}
      />

      <PickerModal
        visible={activePicker === 'project'}
        title="Filter by Project"
        options={projectOptions}
        selectedId={projectId}
        onSelect={(opt) => setProjectId(opt.id)}
        onClose={() => setActivePicker(null)}
      />

      {activePicker === 'startDate' && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setActivePicker(null)}>
            <Pressable onPress={() => null} style={{ margin: spacing.xl, backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: spacing.lg }}>
              <DateTimePicker value={parseDate(startDate)} mode="date" display="inline" onChange={(_, d) => { if (d) { setStartDate(formatDate(d)); setActivePicker(null); } }} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {activePicker === 'startDate' && Platform.OS !== 'ios' && (
        <DateTimePicker value={parseDate(startDate)} mode="date" display="default" onChange={(e, d) => { setActivePicker(null); if (e.type !== 'dismissed' && d) setStartDate(formatDate(d)); }} />
      )}
      {activePicker === 'endDate' && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setActivePicker(null)}>
            <Pressable onPress={() => null} style={{ margin: spacing.xl, backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: spacing.lg }}>
              <DateTimePicker value={parseDate(endDate)} mode="date" display="inline" onChange={(_, d) => { if (d) { setEndDate(formatDate(d)); setActivePicker(null); } }} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {activePicker === 'endDate' && Platform.OS !== 'ios' && (
        <DateTimePicker value={parseDate(endDate)} mode="date" display="default" onChange={(e, d) => { setActivePicker(null); if (e.type !== 'dismissed' && d) setEndDate(formatDate(d)); }} />
      )}
    </SafeAreaView>
  );
};

export default ExpensesScreen;

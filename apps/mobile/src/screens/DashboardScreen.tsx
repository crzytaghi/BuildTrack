import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { colors, spacing, radius, fontSize } from '../theme';
import type { DashboardKpi, RecentExpense, TaskDueSoon } from '../hooks/useDashboard';
import type { DashboardStackParamList } from '../navigation/DashboardStack';

type Nav = NativeStackNavigationProp<DashboardStackParamList, 'DashboardMain'>;

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard = ({ kpi }: { kpi: DashboardKpi }) => {
  const valueColor =
    kpi.positive === true
      ? colors.successText
      : kpi.positive === false
      ? colors.errorText
      : colors.textPrimary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md }}>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{kpi.label}</Text>
      <Text style={{ color: valueColor, fontWeight: '700', fontSize: fontSize.md, marginTop: spacing.xs }}>
        {kpi.value}
      </Text>
    </View>
  );
};

const TaskRow = ({ task }: { task: TaskDueSoon }) => (
  <View style={{ paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
    <Text style={{ color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '500' }} numberOfLines={1}>
      {task.title}
    </Text>
    <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>
      {task.projectName} · Due {task.dueDate}
    </Text>
  </View>
);

const ExpenseRow = ({ expense }: { expense: RecentExpense }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
    <View style={{ flex: 1, marginRight: spacing.sm }}>
      <Text style={{ color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '500' }} numberOfLines={1}>
        {expense.description || expense.vendorName}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>
        {expense.projectName} · {expense.expenseDate}
      </Text>
    </View>
    <Text style={{ color: colors.warningText, fontSize: fontSize.sm, fontWeight: '600' }}>
      ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const DashboardScreen = () => {
  const navigation = useNavigation<Nav>();
  const { companyName, token } = useAuth();
  const { data, loading, refreshing, error, refresh } = useDashboard(token ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }}>
              Dashboard
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
              {companyName ?? 'My Company'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: spacing.xs }}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Error banner */}
        {error && (
          <View style={{ backgroundColor: colors.errorBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.errorText, flex: 1, fontSize: fontSize.sm }}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={{ marginLeft: spacing.md }}>
              <Text style={{ color: colors.errorText, fontWeight: '700', fontSize: fontSize.sm }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI grid */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.md }}>Overview</Text>

          {loading && !data ? (
            <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Loading...</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {data?.kpis.slice(0, 2).map((kpi) => (
                  <KpiCard key={kpi.label} kpi={kpi} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                {data?.kpis.slice(2, 4).map((kpi) => (
                  <KpiCard key={kpi.label} kpi={kpi} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Tasks due soon */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.sm }}>
            Tasks Due Soon
          </Text>
          {loading && !data ? (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Loading...</Text>
          ) : data?.tasksDueSoon.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
              No tasks due in the next 7 days.
            </Text>
          ) : (
            data?.tasksDueSoon.map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </View>

        {/* Recent expenses */}
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.sm }}>
            Recent Expenses
          </Text>
          {loading && !data ? (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Loading...</Text>
          ) : data?.recentExpenses.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
              No expenses recorded yet.
            </Text>
          ) : (
            data?.recentExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

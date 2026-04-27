import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../theme';
import type { ProjectItem, TaskItem, ExpenseItem } from '../../types';

type ProjectTab = 'overview' | 'tasks' | 'expenses' | 'budget' | 'documents';

type Props = {
  project: ProjectItem;
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  onNavigateToTab: (tab: ProjectTab) => void;
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k` : `$${n}`;

const OverviewTab = ({ project, tasks, expenses, onNavigateToTab }: Props) => {
  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const variance = (project.budgetTotal ?? 0) - totalSpend;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const recentExpenses = expenses.slice(0, 5);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
      {/* Summary card */}
      <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
        <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.sm }}>Summary</Text>
        {project.startDate || project.endDate ? (
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
            {project.startDate ?? '—'} → {project.endDate ?? '—'}
          </Text>
        ) : null}
        {project.notes ? (
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
            {project.notes}
          </Text>
        ) : null}
      </View>

      {/* KPI snapshot */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <View style={{ flex: 1, backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>Budget</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>
            {project.budgetTotal ? fmt(project.budgetTotal) : '—'}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>Spend</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>{fmt(totalSpend)}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <View style={{ flex: 1, backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>Variance</Text>
          <Text style={{ color: variance >= 0 ? colors.successText : colors.errorText, fontWeight: '700', marginTop: spacing.xs }}>
            {variance >= 0 ? '+' : ''}{fmt(variance)}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cardBg, padding: spacing.md, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>Tasks</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>
            {doneTasks}/{tasks.length} done
          </Text>
        </View>
      </View>

      {/* Recent tasks */}
      <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600' }}>Open Tasks ({openTasks})</Text>
          <TouchableOpacity onPress={() => onNavigateToTab('tasks')}>
            <Text style={{ color: colors.link, fontSize: fontSize.sm }}>View all</Text>
          </TouchableOpacity>
        </View>
        {tasks.filter((t) => t.status !== 'done').slice(0, 5).map((task) => (
          <View key={task.id} style={{ paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ color: colors.textPrimary, fontSize: fontSize.sm }}>{task.title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>
              {task.status.replace('_', ' ')}{task.dueDate ? ` • Due ${task.dueDate}` : ''}
            </Text>
          </View>
        ))}
        {tasks.filter((t) => t.status !== 'done').length === 0 && (
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No open tasks.</Text>
        )}
      </View>

      {/* Recent expenses */}
      <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600' }}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => onNavigateToTab('expenses')}>
            <Text style={{ color: colors.link, fontSize: fontSize.sm }}>View all</Text>
          </TouchableOpacity>
        </View>
        {recentExpenses.map((expense) => (
          <View key={expense.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ color: colors.textPrimary, fontSize: fontSize.sm, flex: 1 }} numberOfLines={1}>
              {expense.description}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginLeft: spacing.sm }}>
              ${Number(expense.amount).toLocaleString()}
            </Text>
          </View>
        ))}
        {recentExpenses.length === 0 && (
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No expenses yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default OverviewTab;

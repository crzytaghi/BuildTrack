import { ScrollView, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem } from '../../types';

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k` : `$${n.toLocaleString()}`;

type Props = {
  project: ProjectItem;
  lineItems: BudgetLineItem[];
  expenses: ExpenseItem[];
  categories: Category[];
};

const BudgetTab = ({ lineItems, expenses, categories }: Props) => {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const spendByLineItem: Record<string, number> = {};
  expenses.forEach((e) => {
    if (e.lineItemId) spendByLineItem[e.lineItemId] = (spendByLineItem[e.lineItemId] ?? 0) + Number(e.amount);
  });

  const totalBudgeted = lineItems.reduce((s, li) => s + li.budgetedAmount, 0);
  const totalSpent = lineItems.reduce((s, li) => s + (spendByLineItem[li.id] ?? 0), 0);

  if (lineItems.length === 0) {
    return (
      <View style={{ padding: spacing.xl }}>
        <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No budget line items yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
      {lineItems.map((li) => {
        const spent = spendByLineItem[li.id] ?? 0;
        const progress = li.budgetedAmount > 0 ? Math.min(spent / li.budgetedAmount, 1) : 0;
        const overBudget = spent > li.budgetedAmount;
        return (
          <View key={li.id} style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1 }} numberOfLines={1}>{li.description}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginLeft: spacing.sm }}>{categoryMap[li.categoryId] ?? ''}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.inputBg, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.sm }}>
              <View style={{ height: 6, width: `${Math.round(progress * 100)}%`, backgroundColor: overBudget ? colors.errorText : colors.primary, borderRadius: radius.full }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: overBudget ? colors.errorText : colors.textSecondary, fontSize: fontSize.xs }}>{fmt(spent)} spent</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{fmt(li.budgetedAmount)} budgeted</Text>
            </View>
          </View>
        );
      })}

      <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600' }}>Total Budgeted</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{fmt(totalBudgeted)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600' }}>Total Spent</Text>
          <Text style={{ color: totalSpent > totalBudgeted ? colors.errorText : colors.textPrimary, fontWeight: '700' }}>{fmt(totalSpent)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default BudgetTab;

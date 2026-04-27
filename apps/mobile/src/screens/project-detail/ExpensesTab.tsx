import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '../../theme';
import type { ProjectItem, ExpenseItem } from '../../types';

type Props = {
  project: ProjectItem;
  expenses: ExpenseItem[];
  setExpenses: (expenses: ExpenseItem[]) => void;
};

const ExpensesTab = ({ expenses }: Props) => (
  <View style={{ flex: 1, padding: spacing.xl }}>
    <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
      <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.sm }}>
        Expenses — Coming in Sprint 3
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
        Full expense management (create, edit, filter by category/vendor) will be implemented in Sprint 3.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md }}>
        {expenses.length} expense{expenses.length !== 1 ? 's' : ''} on this project.
      </Text>
    </View>
  </View>
);

export default ExpensesTab;

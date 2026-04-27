import { Text, View } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../theme';
import type { ProjectItem } from '../../types';

type Props = { project: ProjectItem };

const BudgetTab = ({ project }: Props) => (
  <View style={{ flex: 1, padding: spacing.xl }}>
    <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
      <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.sm }}>
        Budget — Coming in Sprint 3
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
        Budget line items with spend progress bars will be implemented in Sprint 3.
      </Text>
      {project.budgetTotal != null && (
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md }}>
          Total budget: ${project.budgetTotal.toLocaleString()}
        </Text>
      )}
    </View>
  </View>
);

export default BudgetTab;

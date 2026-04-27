import { Text, View } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../theme';
import type { ProjectItem } from '../../types';

type Props = { project: ProjectItem };

const DocumentsTab = ({ project: _ }: Props) => (
  <View style={{ flex: 1, padding: spacing.xl }}>
    <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg }}>
      <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.sm }}>
        Documents — Coming in Sprint 4
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
        Document upload and management will be available here in a future sprint.
      </Text>
    </View>
  </View>
);

export default DocumentsTab;

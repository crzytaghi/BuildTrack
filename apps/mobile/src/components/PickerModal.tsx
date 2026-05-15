import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme';

export type PickerOption = { id: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedId?: string;
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
  onManageCategories?: () => void;
};

const PickerModal = ({ visible, title, options, selectedId, onSelect, onClose, onManageCategories }: Props) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onPress={onClose}
    >
      <Pressable
        onPress={() => null}
        style={{ backgroundColor: colors.cardBg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '60%' }}
      >
        <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600', fontSize: fontSize.md }}>{title}</Text>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { onSelect(item); onClose(); }}
              style={{
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: item.id === selectedId ? colors.primary : colors.textPrimary, fontSize: fontSize.sm }}>
                {item.label}
              </Text>
              {item.id === selectedId && (
                <Text style={{ color: colors.primary, fontSize: fontSize.sm }}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        />
        {onManageCategories && (
          <TouchableOpacity
            onPress={() => { onClose(); onManageCategories(); }}
            style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}
          >
            <Text style={{ color: colors.link, fontSize: fontSize.sm, textAlign: 'center' }}>Manage Categories</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

export default PickerModal;

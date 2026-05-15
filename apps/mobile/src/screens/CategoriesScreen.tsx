import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../lib/api';
import { colors, fontSize, radius, spacing } from '../theme';
import type { Category } from '../types';
import type { ProjectsStackParamList } from '../navigation/ProjectsStack';

const API_BASE = getApiBase();

type Nav = NativeStackNavigationProp<ProjectsStackParamList, 'Categories'>;
type Route = RouteProp<ProjectsStackParamList, 'Categories'>;

const CategoriesScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { onCategoriesChange } = route.params ?? {};

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [inUseMessages, setInUseMessages] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { data: Category[] };
      const sorted = data.data.slice().sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sorted);
      onCategoriesChange?.(sorted);
    }
    setLoading(false);
  }, [token, onCategoriesChange]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewName('');
      setAddError('');
      await fetchCategories();
    } else {
      setAddError('Unable to add category');
    }
  };

  const handleRename = async (id: string) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) await fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setInUseMessages((prev) => { const next = { ...prev }; delete next[id]; return next; });
      await fetchCategories();
    } else if (res.status === 409) {
      const data = (await res.json()) as { expenseCount: number; lineItemCount: number };
      const parts: string[] = [];
      if (data.expenseCount > 0) parts.push(`${data.expenseCount} expense${data.expenseCount !== 1 ? 's' : ''}`);
      if (data.lineItemCount > 0) parts.push(`${data.lineItemCount} budget line item${data.lineItemCount !== 1 ? 's' : ''}`);
      setInUseMessages((prev) => ({ ...prev, [id]: `Used by ${parts.join(' and ')}. Update those before deleting.` }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.sm }}>
          <Text style={{ color: colors.link, fontSize: fontSize.sm }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }}>Categories</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        {addError ? (
          <Text style={{ color: colors.errorText, fontSize: fontSize.sm, marginBottom: spacing.xs }}>{addError}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput
            value={newName}
            onChangeText={(v) => { setNewName(v); setAddError(''); }}
            placeholder="New category name"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            style={{ flex: 1, backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle }}
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.lg, borderRadius: radius.md, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            {loading ? 'Loading...' : 'No categories yet.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            {renamingId === item.id ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <TextInput
                  value={renameValue}
                  onChangeText={setRenameValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => handleRename(item.id)}
                  style={{ flex: 1, backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle }}
                />
                <TouchableOpacity onPress={() => handleRename(item.id)}>
                  <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRenamingId(null)}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '500', flex: 1, marginRight: spacing.sm }}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                    <TouchableOpacity onPress={() => { setRenamingId(item.id); setRenameValue(item.name); }}>
                      <Text style={{ color: colors.link, fontSize: fontSize.sm }}>Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Text style={{ color: colors.errorText, fontSize: fontSize.sm }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {inUseMessages[item.id] && (
                  <Text style={{ color: colors.warningText, fontSize: fontSize.xs, marginTop: spacing.xs }}>
                    {inUseMessages[item.id]}
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default CategoriesScreen;

import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getApiBase } from '../../lib/api';
import PickerModal from '../../components/PickerModal';
import { colors, fontSize, radius, spacing } from '../../theme';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, VendorItem } from '../../types';
import type { ProjectsStackParamList } from '../../navigation/ProjectsStack';

const API_BASE = getApiBase();

type ExpenseForm = { vendorId: string; description: string; amount: string; categoryId: string; expenseDate: string; lineItemId: string };
const emptyForm: ExpenseForm = { vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' };

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseDate = (v?: string) => { const p = new Date(v ?? ''); return Number.isNaN(p.getTime()) ? new Date() : p; };

type Nav = NativeStackNavigationProp<ProjectsStackParamList>;

type Props = {
  project: ProjectItem;
  expenses: ExpenseItem[];
  setExpenses: (expenses: ExpenseItem[]) => void;
  vendors: VendorItem[];
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  lineItems: BudgetLineItem[];
};

type OpenPicker = 'vendor' | 'category' | 'lineItem' | null;

const ExpensesTab = ({ project, expenses, setExpenses, vendors, categories, setCategories, lineItems }: Props) => {
  const { token } = useAuth();
  const navigation = useNavigation<Nav>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setError(null); setShowForm(true); };
  const openEdit = (e: ExpenseItem) => {
    setForm({ vendorId: e.vendorId, description: e.description, amount: String(e.amount), categoryId: e.categoryId, expenseDate: e.expenseDate, lineItemId: e.lineItemId ?? '' });
    setEditingId(e.id); setError(null); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(null); };

  const submit = async () => {
    if (!form.vendorId || !form.description.trim() || !form.amount || !form.categoryId || !form.expenseDate) {
      setError('Vendor, description, amount, category and date are required');
      return;
    }
    const payload = {
      vendorId: form.vendorId, description: form.description.trim(),
      amount: Number(form.amount), categoryId: form.categoryId,
      expenseDate: form.expenseDate,
      lineItemId: form.lineItemId || undefined,
    };
    const url = editingId ? `${API_BASE}/expenses/${editingId}` : `${API_BASE}/projects/${project.id}/expenses`;
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { setError(editingId ? 'Unable to update expense' : 'Unable to create expense'); return; }
    const data = (await res.json()) as { data: ExpenseItem };
    setExpenses(editingId ? expenses.map((e) => (e.id === editingId ? data.data : e)) : [...expenses, data.data]);
    closeForm();
  };

  const lineItemOptions = [
    { id: '', label: 'No line item (optional)' },
    ...lineItems.map((li) => ({ id: li.id, label: li.description })),
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {!showForm && (
        <View style={{ padding: spacing.xl, paddingBottom: 0 }}>
          <TouchableOpacity
            onPress={openCreate}
            style={{ backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' }}
          >
            <Text style={{ color: colors.primaryText, fontWeight: '700' }}>+ Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {showForm && (
        <ScrollView
          style={{ backgroundColor: colors.cardBg, margin: spacing.xl, borderRadius: radius.lg }}
          contentContainerStyle={{ padding: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.md }}>
            {editingId ? 'Edit Expense' : 'New Expense'}
          </Text>
          {error && (
            <View style={{ backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm }}>
              <Text style={{ color: colors.errorText, fontSize: fontSize.sm }}>{error}</Text>
            </View>
          )}

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Vendor *</Text>
          <TouchableOpacity onPress={() => setOpenPicker('vendor')} style={{ backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
            <Text style={{ color: form.vendorId ? colors.textPrimary : colors.textMuted }}>
              {form.vendorId ? vendorMap[form.vendorId] : 'Select vendor'}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Description *</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
            placeholder="Enter description"
            placeholderTextColor={colors.textMuted}
            style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}
          />

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Amount *</Text>
          <TextInput
            value={form.amount}
            onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}
          />

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Category *</Text>
          <TouchableOpacity onPress={() => setOpenPicker('category')} style={{ backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
            <Text style={{ color: form.categoryId ? colors.textPrimary : colors.textMuted }}>
              {form.categoryId ? categories.find((c) => c.id === form.categoryId)?.name : 'Select category'}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Date *</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <TextInput
              value={form.expenseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              editable={false}
              pointerEvents="none"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}
            />
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>Line Item</Text>
          <TouchableOpacity onPress={() => setOpenPicker('lineItem')} style={{ backgroundColor: colors.inputBg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.lg }}>
            <Text style={{ color: form.lineItemId ? colors.textPrimary : colors.textMuted }}>
              {form.lineItemId ? lineItems.find((li) => li.id === form.lineItemId)?.description : 'None (optional)'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity onPress={closeForm} style={{ flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textLabel }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} style={{ flex: 1, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' }}>
              <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{editingId ? 'Update' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <FlatList
        data={expenses.slice().sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: showForm ? 0 : spacing.md }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={{ color: colors.textMuted }}>No expenses yet.</Text>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1, marginRight: spacing.sm }} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={{ color: colors.warningText, fontWeight: '700' }}>${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
              {vendorMap[item.vendorId] ?? 'Unknown vendor'} · {item.expenseDate}
            </Text>
            <TouchableOpacity
              onPress={() => openEdit(item)}
              style={{ marginTop: spacing.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm }}
            >
              <Text style={{ color: colors.textLabel, fontSize: fontSize.sm }}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <PickerModal
        visible={openPicker === 'vendor'}
        title="Select Vendor"
        options={vendors.map((v) => ({ id: v.id, label: v.name }))}
        selectedId={form.vendorId}
        onSelect={(opt) => setForm((p) => ({ ...p, vendorId: opt.id }))}
        onClose={() => setOpenPicker(null)}
      />
      <PickerModal
        visible={openPicker === 'category'}
        title="Select Category"
        options={categories.map((c) => ({ id: c.id, label: c.name }))}
        selectedId={form.categoryId}
        onSelect={(opt) => setForm((p) => ({ ...p, categoryId: opt.id }))}
        onClose={() => setOpenPicker(null)}
        onManageCategories={() => navigation.navigate('Categories', { onCategoriesChange: setCategories })}
      />
      <PickerModal
        visible={openPicker === 'lineItem'}
        title="Link to Line Item"
        options={lineItemOptions}
        selectedId={form.lineItemId}
        onSelect={(opt) => setForm((p) => ({ ...p, lineItemId: opt.id }))}
        onClose={() => setOpenPicker(null)}
      />

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowDatePicker(false)}>
            <Pressable onPress={() => null} style={{ margin: spacing.xl, backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: spacing.lg }}>
              <DateTimePicker value={parseDate(form.expenseDate)} mode="date" display="inline" onChange={(_, d) => { if (d) { setForm((p) => ({ ...p, expenseDate: formatDate(d) })); setShowDatePicker(false); } }} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {showDatePicker && Platform.OS !== 'ios' && (
        <DateTimePicker value={parseDate(form.expenseDate)} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (e.type !== 'dismissed' && d) setForm((p) => ({ ...p, expenseDate: formatDate(d) })); }} />
      )}
    </KeyboardAvoidingView>
  );
};

export default ExpensesTab;

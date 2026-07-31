import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { getApiBase } from '../../lib/api';
import { colors, spacing, radius, fontSize } from '../../theme';
import type { ProjectItem, TaskItem } from '../../types';

const API_BASE = getApiBase();

const STATUS_OPTIONS = ['todo', 'in_progress', 'blocked', 'done'] as TaskItem['status'][];
const STATUS_LABELS: Record<TaskItem['status'], string> = {
  todo: 'To-Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseDate = (v?: string) => {
  if (!v) return new Date();
  const p = new Date(v);
  return Number.isNaN(p.getTime()) ? new Date() : p;
};

type Props = {
  project: ProjectItem;
  tasks: TaskItem[];
  setTasks: (tasks: TaskItem[]) => void;
};

const TODAY = new Date().toISOString().split('T')[0];
const emptyForm = { title: '', status: 'todo' as TaskItem['status'], dueDate: '' };

const TasksTab = ({ project, tasks, setTasks }: Props) => {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (task: TaskItem) => {
    setForm({ title: task.title, status: task.status, dueDate: task.dueDate ?? '' });
    setEditingId(task.id);
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    const payload = { title: form.title.trim(), status: form.status, dueDate: form.dueDate || undefined };
    const url = editingId ? `${API_BASE}/tasks/${editingId}` : `${API_BASE}/projects/${project.id}/tasks`;
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { setError(editingId ? 'Unable to update task' : 'Unable to create task'); return; }
    const data = (await res.json()) as { data: TaskItem };
    if (editingId) {
      setTasks(tasks.map((t) => (t.id === editingId ? data.data : t)));
    } else {
      setTasks([...tasks, data.data]);
    }
    closeForm();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Create button */}
      {!showForm && (
        <View style={{ padding: spacing.xl, paddingBottom: 0 }}>
          <TouchableOpacity
            onPress={openCreate}
            style={{ backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' }}
          >
            <Text style={{ color: colors.primaryText, fontWeight: '700' }}>+ Add Task</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form */}
      {showForm && (
        <View style={{ backgroundColor: colors.cardBg, margin: spacing.xl, padding: spacing.lg, borderRadius: radius.lg }}>
          <Text style={{ color: colors.textLabel, fontWeight: '600', marginBottom: spacing.md }}>
            {editingId ? 'Edit Task' : 'New Task'}
          </Text>

          {error && (
            <View style={{ backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm }}>
              <Text style={{ color: colors.errorText, fontSize: fontSize.sm }}>{error}</Text>
            </View>
          )}

          <TextInput
            value={form.title}
            onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
            placeholder="Task title *"
            placeholderTextColor={colors.textMuted}
            style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md }}
          />

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm }}>Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setForm((p) => ({ ...p, status: s }))}
                style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: form.status === s ? colors.primary : colors.inputBg }}
              >
                <Text style={{ color: form.status === s ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <TextInput
              value={form.dueDate}
              placeholder="Due date"
              placeholderTextColor={colors.textMuted}
              editable={false}
              pointerEvents="none"
              style={{ marginTop: spacing.md, backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md }}
            />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <TouchableOpacity onPress={closeForm} style={{ flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textLabel }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} style={{ flex: 1, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' }}>
              <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{editingId ? 'Update' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Task list */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: showForm ? 0 : spacing.md }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={{ color: colors.textMuted }}>No tasks yet.</Text>}
        renderItem={({ item }) => {
          const isOverdue = item.dueDate && item.dueDate < TODAY && item.status !== 'done';
          return (
            <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1 }}>{item.title}</Text>
                {isOverdue && (
                  <View style={{ backgroundColor: colors.errorBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full }}>
                    <Text style={{ color: colors.errorText, fontSize: fontSize.xs, fontWeight: '600' }}>Overdue</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
                {STATUS_LABELS[item.status]}{item.dueDate ? ` • Due ${item.dueDate}` : ''}
              </Text>
              <TouchableOpacity
                onPress={() => openEdit(item)}
                style={{ marginTop: spacing.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm }}
              >
                <Text style={{ color: colors.textLabel, fontSize: fontSize.sm }}>Edit</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Date picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowDatePicker(false)}>
            <Pressable onPress={() => null} style={{ margin: spacing.xl, backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: spacing.lg }}>
              <DateTimePicker value={parseDate(form.dueDate)} mode="date" display="inline" onChange={(_, d) => { if (d) { setForm((p) => ({ ...p, dueDate: formatDate(d) })); setShowDatePicker(false); } }} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {showDatePicker && Platform.OS !== 'ios' && (
        <DateTimePicker value={parseDate(form.dueDate)} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (e.type !== 'dismissed' && d) setForm((p) => ({ ...p, dueDate: formatDate(d) })); }} />
      )}
    </View>
  );
};

export default TasksTab;

import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../lib/api';
import { colors, spacing, radius, fontSize } from '../theme';
import type { ProjectItem, TaskItem } from '../types';

const API_BASE = getApiBase();

const STATUS_OPTIONS = ['todo', 'in_progress', 'blocked', 'done'] as TaskItem['status'][];
const STATUS_LABELS: Record<TaskItem['status'], string> = {
  todo: 'To-Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};
const TODAY = new Date().toISOString().split('T')[0];

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value?: string) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const TasksScreen = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [mode, setMode] = useState<'filter' | 'create'>('filter');
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [filters, setFilters] = useState({ projectId: '', status: '', fromDate: '', toDate: '' });
  const [form, setForm] = useState({ title: '', projectId: '', status: 'todo' as TaskItem['status'], dueDate: '' });

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [projects]);

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = (await res.json()) as { data: ProjectItem[] };
      setProjects(data.data);
    } catch { /* silent */ }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.status && filters.status !== 'overdue') params.set('status', filters.status);
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      const query = params.toString();
      const res = await fetch(`${API_BASE}/tasks${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unable to load tasks');
      const data = (await res.json()) as { data: TaskItem[] };
      const filtered = filters.status === 'overdue'
        ? data.data.filter((t) => t.dueDate && t.dueDate < TODAY && t.status !== 'done')
        : data.data;
      setTasks(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { loadTasks(); }, [filters.projectId, filters.status, filters.fromDate, filters.toDate]);

  const resetForm = () => {
    setForm({ title: '', projectId: '', status: 'todo', dueDate: '' });
    setEditingTaskId(null);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.projectId) {
      setError('Task title and project are required');
      return;
    }
    setError(null);
    const payload = { title: form.title.trim(), status: form.status, dueDate: form.dueDate || undefined };
    const url = editingTaskId
      ? `${API_BASE}/tasks/${editingTaskId}`
      : `${API_BASE}/projects/${form.projectId}/tasks`;
    const res = await fetch(url, {
      method: editingTaskId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError(editingTaskId ? 'Unable to update task' : 'Unable to create task');
      return;
    }
    resetForm();
    loadTasks();
    setMode('filter');
  };

  const handleEdit = (task: TaskItem) => {
    setMode('create');
    setEditingTaskId(task.id);
    setForm({ title: task.title, projectId: task.projectId, status: task.status, dueDate: task.dueDate ?? '' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <View style={{ flex: 1, padding: spacing.xl }}>
        <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.lg }}>
          Tasks
        </Text>

        {error && (
          <View style={{ marginBottom: spacing.md, backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm }}>
            <Text style={{ color: colors.errorText }}>{error}</Text>
          </View>
        )}

        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: spacing.xs, marginBottom: spacing.md }}>
          {(['filter', 'create'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); if (m === 'filter') resetForm(); }}
              style={{
                flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center',
                backgroundColor: mode === m ? colors.primary : 'transparent',
              }}
            >
              <Text style={{ color: mode === m ? colors.primaryText : colors.textLabel, fontWeight: '600', fontSize: fontSize.sm }}>
                {m === 'filter' ? 'Filter Tasks' : editingTaskId ? 'Edit Task' : 'New Task'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'filter' ? (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm }}>Project</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setFilters((p) => ({ ...p, projectId: '' }))}
                style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: !filters.projectId ? colors.primary : colors.inputBg }}
              >
                <Text style={{ color: !filters.projectId ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>All</Text>
              </TouchableOpacity>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setFilters((prev) => ({ ...prev, projectId: p.id }))}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: filters.projectId === p.id ? colors.primary : colors.inputBg }}
                >
                  <Text style={{ color: filters.projectId === p.id ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm }}>Status</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setFilters((p) => ({ ...p, status: '' }))}
                style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: !filters.status ? colors.primary : colors.inputBg }}
              >
                <Text style={{ color: !filters.status ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilters((p) => ({ ...p, status: 'overdue' }))}
                style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: filters.status === 'overdue' ? colors.errorBg : colors.inputBg }}
              >
                <Text style={{ color: filters.status === 'overdue' ? colors.errorText : colors.textLabel, fontSize: fontSize.sm }}>Overdue</Text>
              </TouchableOpacity>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setFilters((p) => ({ ...p, status: s }))}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: filters.status === s ? colors.primary : colors.inputBg }}
                >
                  <Text style={{ color: filters.status === s ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Task title *"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm }}>Project</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setForm((prev) => ({ ...prev, projectId: p.id }))}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: form.projectId === p.id ? colors.primary : colors.inputBg }}
                >
                  <Text style={{ color: form.projectId === p.id ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm }}>Status</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setForm((p) => ({ ...p, status: s }))}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: form.status === s ? colors.primary : colors.inputBg }}
                >
                  <Text style={{ color: form.status === s ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowDueDatePicker(true)} activeOpacity={0.8}>
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
              {editingTaskId && (
                <TouchableOpacity onPress={() => { resetForm(); setMode('filter'); }} style={{ flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textLabel }}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={submit} style={{ flex: 1, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' }}>
                <Text style={{ color: colors.primaryText, fontWeight: '700' }}>
                  {editingTaskId ? 'Update Task' : 'Create Task'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Task list */}
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading tasks...</Text>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
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
                    {projectMap[item.projectId] ?? 'Unknown'} • {STATUS_LABELS[item.status]}
                    {item.dueDate ? ` • ${item.dueDate}` : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={{ marginTop: spacing.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm }}
                  >
                    <Text style={{ color: colors.textLabel, fontSize: fontSize.sm }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Date pickers */}
      {showDueDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowDueDatePicker(false)}>
            <Pressable onPress={() => null} style={{ margin: spacing.xl, backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: spacing.lg }}>
              <DateTimePicker value={parseDate(form.dueDate)} mode="date" display="inline" onChange={(_, d) => { if (d) { setForm((p) => ({ ...p, dueDate: formatDate(d) })); setShowDueDatePicker(false); } }} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {showDueDatePicker && Platform.OS !== 'ios' && (
        <DateTimePicker value={parseDate(form.dueDate)} mode="date" display="default" onChange={(e, d) => { setShowDueDatePicker(false); if (e.type !== 'dismissed' && d) setForm((p) => ({ ...p, dueDate: formatDate(d) })); }} />
      )}
    </SafeAreaView>
  );
};

export default TasksScreen;

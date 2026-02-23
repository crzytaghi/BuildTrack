import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import SlideMenu, { MenuItem } from '../components/SlideMenu';
import { getApiBase } from '../lib/api';
import type { ProjectItem, TaskItem } from '../types';

const API_BASE = getApiBase();

type Props = {
  token: string;
  onLogout: () => void;
  onNavigate: (route: string) => void;
};

const TasksScreen = ({ token, onLogout, onNavigate }: Props) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [mode, setMode] = useState<'filter' | 'create'>('filter');
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [form, setForm] = useState({
    title: '',
    projectId: '',
    status: 'todo' as TaskItem['status'],
    dueDate: '',
  });
  const statusLabelMap: Record<TaskItem['status'], string> = {
    todo: 'To-Do',
    in_progress: 'In-Progress',
    blocked: 'Blocked',
    done: 'Done',
  };

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

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((project) => {
      map[project.id] = project.name;
    });
    return map;
  }, [projects]);

  const items: MenuItem[] = [
    { label: 'Dashboard', onPress: () => onNavigate('Dashboard') },
    { label: 'Projects', onPress: () => onNavigate('Projects') },
    { label: 'Tasks', onPress: () => onNavigate('Tasks') },
    { label: 'Budget', onPress: () => onNavigate('Budget') },
    { label: 'Expenses', onPress: () => onNavigate('Expenses') },
    { label: 'Documents', onPress: () => onNavigate('Documents') },
    { label: 'Reports', onPress: () => onNavigate('Reports') },
    { label: 'Settings', onPress: () => onNavigate('Settings') },
    { label: 'Log out', onPress: onLogout },
  ];

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unable to load projects');
      const data = (await res.json()) as { data: ProjectItem[] };
      setProjects(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects');
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.status) params.set('status', filters.status);
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      const query = params.toString();
      const res = await fetch(`${API_BASE}/tasks${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unable to load tasks');
      const data = (await res.json()) as { data: TaskItem[] };
      setTasks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters.projectId, filters.status, filters.fromDate, filters.toDate]);

  const resetForm = () => {
    setForm({ title: '', projectId: '', status: 'todo', dueDate: '' });
    setEditingTaskId(null);
  };

  const submit = async () => {
    if (editingTaskId) {
      if (!form.title.trim() || !form.projectId) {
        setError('Task title and project are required');
        return;
      }
    } else {
      if (!form.title.trim() || !form.projectId || !form.status || !form.dueDate) {
        setError('All fields are required to create a task');
        return;
      }
    }
    setError(null);
    if (!editingTaskId && mode !== 'create') {
      setError('Switch to create mode to add a task');
      return;
    }
    const payload = {
      title: form.title.trim(),
      status: form.status,
      dueDate: form.dueDate || undefined,
    };
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
  };

  const handleEdit = (task: TaskItem) => {
    setMode('create');
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      projectId: task.projectId,
      status: task.status,
      dueDate: task.dueDate ?? '',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1118' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700' }}>Tasks</Text>
          <TouchableOpacity onPress={() => setMenuOpen(true)}>
            <Text style={{ color: '#e2e8f0', fontSize: 20 }}>☰</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={{ marginTop: 12, backgroundColor: '#7f1d1d', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fecaca' }}>{error}</Text>
          </View>
        )}

        <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
          <Text style={{ color: '#e2e8f0', marginBottom: 12 }}>Mode</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setMode('filter')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: mode === 'filter' ? '#0ea5e9' : '#111827',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: mode === 'filter' ? '#0f172a' : '#e2e8f0', fontWeight: '600' }}>
                Filter Tasks
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('create')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: mode === 'create' ? '#0ea5e9' : '#111827',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: mode === 'create' ? '#0f172a' : '#e2e8f0', fontWeight: '600' }}>
                Create Task
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'filter' ? (
          <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
            <Text style={{ color: '#e2e8f0', marginBottom: 10 }}>Filters</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>Project</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setFilters((prev) => ({ ...prev, projectId: '' }))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: filters.projectId ? '#111827' : '#0ea5e9',
                }}
              >
                <Text style={{ color: filters.projectId ? '#e2e8f0' : '#0f172a', fontSize: 12 }}>
                  All
                </Text>
              </TouchableOpacity>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => setFilters((prev) => ({ ...prev, projectId: project.id }))}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: filters.projectId === project.id ? '#0ea5e9' : '#111827',
                  }}
                >
                  <Text
                    style={{
                      color: filters.projectId === project.id ? '#0f172a' : '#e2e8f0',
                      fontSize: 12,
                    }}
                  >
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 10, marginBottom: 8 }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setFilters((prev) => ({ ...prev, status: '' }))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: filters.status ? '#111827' : '#0ea5e9',
                }}
              >
                <Text style={{ color: filters.status ? '#e2e8f0' : '#0f172a', fontSize: 12 }}>
                  All
                </Text>
              </TouchableOpacity>
              {(['todo', 'in_progress', 'blocked', 'done'] as TaskItem['status'][]).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFilters((prev) => ({ ...prev, status }))}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: filters.status === status ? '#0ea5e9' : '#111827',
                  }}
                >
                  <Text
                    style={{
                      color: filters.status === status ? '#0f172a' : '#e2e8f0',
                      fontSize: 12,
                    }}
                  >
                    {statusLabelMap[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowFromDatePicker(true)} activeOpacity={0.8}>
              <TextInput
                value={filters.fromDate}
                placeholder="From date"
                placeholderTextColor="#64748b"
                editable={false}
                pointerEvents="none"
                style={{ marginTop: 10, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowToDatePicker(true)} activeOpacity={0.8}>
              <TextInput
                value={filters.toDate}
                placeholder="To date"
                placeholderTextColor="#64748b"
                editable={false}
                pointerEvents="none"
                style={{ marginTop: 10, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#e2e8f0' }}>{editingTaskId ? 'Edit Task' : 'New Task'}</Text>
              {editingTaskId ? (
                <TouchableOpacity onPress={resetForm}>
                  <Text style={{ color: '#93c5fd' }}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="Task title"
              placeholderTextColor="#64748b"
              style={{ marginTop: 12, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 12, marginBottom: 8 }}>
              Project
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => setForm((prev) => ({ ...prev, projectId: project.id }))}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: form.projectId === project.id ? '#0ea5e9' : '#111827',
                  }}
                >
                  <Text
                    style={{
                      color: form.projectId === project.id ? '#0f172a' : '#e2e8f0',
                      fontSize: 12,
                    }}
                  >
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 10, marginBottom: 8 }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['todo', 'in_progress', 'blocked', 'done'] as TaskItem['status'][]).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setForm((prev) => ({ ...prev, status }))}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: form.status === status ? '#0ea5e9' : '#111827',
                  }}
                >
                  <Text
                    style={{
                      color: form.status === status ? '#0f172a' : '#e2e8f0',
                      fontSize: 12,
                    }}
                  >
                    {statusLabelMap[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowDueDatePicker(true)} activeOpacity={0.8}>
              <TextInput
                value={form.dueDate}
                placeholder="Due date"
                placeholderTextColor="#64748b"
                editable={false}
                pointerEvents="none"
                style={{ marginTop: 10, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              style={{ marginTop: 12, backgroundColor: '#0ea5e9', padding: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#0f172a', fontWeight: '700' }}>
                {editingTaskId ? 'Update Task' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        )}


        <View style={{ flex: 1, marginTop: 16 }}>
          {loading ? (
            <Text style={{ color: '#94a3b8' }}>Loading tasks...</Text>
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: '#111827', padding: 14, borderRadius: 14, marginBottom: 12 }}>
                  <Text style={{ color: '#f8fafc', fontWeight: '600' }}>{item.title}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                    {projectMap[item.projectId] ?? 'Unknown Project'} • {statusLabelMap[item.status]} • {item.dueDate || 'No due date'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={{ marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
                  >
                    <Text style={{ color: '#e2e8f0', fontSize: 12 }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} items={items} />

      {showFromDatePicker && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade">
          <Pressable
            style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => {
              setFilters((prev) => ({ ...prev, fromDate: '' }));
              setShowFromDatePicker(false);
            }}
          >
            <Pressable
              onPress={() => null}
              style={{ margin: 20, backgroundColor: '#0f172a', borderRadius: 16, padding: 16 }}
            >
              <DateTimePicker
                value={parseDate(filters.fromDate)}
                mode="date"
                display="inline"
                onChange={(_, selected) => {
                  if (selected) {
                    setFilters((prev) => ({ ...prev, fromDate: formatDate(selected) }));
                    setShowFromDatePicker(false);
                  }
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      {showFromDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={parseDate(filters.fromDate)}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowFromDatePicker(false);
            if (event.type === 'dismissed') {
              setFilters((prev) => ({ ...prev, fromDate: '' }));
              return;
            }
            if (selected) {
              setFilters((prev) => ({ ...prev, fromDate: formatDate(selected) }));
            }
          }}
        />
      ) : null}

      {showToDatePicker && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade">
          <Pressable
            style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => {
              setFilters((prev) => ({ ...prev, toDate: '' }));
              setShowToDatePicker(false);
            }}
          >
            <Pressable
              onPress={() => null}
              style={{ margin: 20, backgroundColor: '#0f172a', borderRadius: 16, padding: 16 }}
            >
              <DateTimePicker
                value={parseDate(filters.toDate)}
                mode="date"
                display="inline"
                onChange={(_, selected) => {
                  if (selected) {
                    setFilters((prev) => ({ ...prev, toDate: formatDate(selected) }));
                    setShowToDatePicker(false);
                  }
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      {showToDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={parseDate(filters.toDate)}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowToDatePicker(false);
            if (event.type === 'dismissed') {
              setFilters((prev) => ({ ...prev, toDate: '' }));
              return;
            }
            if (selected) {
              setFilters((prev) => ({ ...prev, toDate: formatDate(selected) }));
            }
          }}
        />
      ) : null}

      {showDueDatePicker && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade">
          <Pressable
            style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => {
              setForm((prev) => ({ ...prev, dueDate: '' }));
              setShowDueDatePicker(false);
            }}
          >
            <Pressable
              onPress={() => null}
              style={{ margin: 20, backgroundColor: '#0f172a', borderRadius: 16, padding: 16 }}
            >
              <DateTimePicker
                value={parseDate(form.dueDate)}
                mode="date"
                display="inline"
                onChange={(_, selected) => {
                  if (selected) {
                    setForm((prev) => ({ ...prev, dueDate: formatDate(selected) }));
                    setShowDueDatePicker(false);
                  }
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      {showDueDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={parseDate(form.dueDate)}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowDueDatePicker(false);
            if (event.type === 'dismissed') {
              setForm((prev) => ({ ...prev, dueDate: '' }));
              return;
            }
            if (selected) {
              setForm((prev) => ({ ...prev, dueDate: formatDate(selected) }));
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default TasksScreen;

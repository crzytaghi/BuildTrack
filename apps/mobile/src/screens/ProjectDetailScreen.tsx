import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getApiBase } from '../lib/api';
import type { ExpenseItem, ProjectItem, TaskItem } from '../types';

const API_BASE = getApiBase();

type Props = {
  token: string;
  projectId: string;
  onBack: () => void;
};

const ProjectDetailScreen = ({ token, projectId, onBack }: Props) => {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    status: 'planning' as ProjectItem['status'],
    startDate: '',
    endDate: '',
    budgetTotal: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, tasksRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE}/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/projects/${projectId}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/projects/${projectId}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!projectRes.ok) throw new Error('Unable to load project');
      const projectData = (await projectRes.json()) as { data: ProjectItem };
      const tasksData = (await tasksRes.json()) as { data: TaskItem[] };
      const expensesData = (await expensesRes.json()) as { data: ExpenseItem[] };
      setProject(projectData.data);
      setTasks(tasksData.data);
      setExpenses(expensesData.data);
      setForm({
        name: projectData.data.name,
        status: projectData.data.status,
        startDate: projectData.data.startDate ?? '',
        endDate: projectData.data.endDate ?? '',
        budgetTotal: projectData.data.budgetTotal?.toString() ?? '',
        notes: projectData.data.notes ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const save = async () => {
    if (!project || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          status: form.status,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Unable to save project');
      const data = (await res.json()) as { data: ProjectItem };
      setProject(data.data);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1118', padding: 20 }}>
        <Text style={{ color: '#94a3b8' }}>Loading project...</Text>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1118', padding: 20 }}>
        <Text style={{ color: '#fecaca' }}>{error ?? 'Project not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1118' }} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ color: '#e2e8f0' }}>← Back to Projects</Text>
      </TouchableOpacity>
      <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700', marginTop: 12 }}>{project.name}</Text>
      <Text style={{ color: '#94a3b8', marginBottom: 12 }}>Status: {project.status}</Text>

      <View style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#e2e8f0' }}>Project Summary</Text>
          <TouchableOpacity onPress={() => setIsEditing((prev) => !prev)}>
            <Text style={{ color: '#93c5fd' }}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        {isEditing ? (
          <View style={{ marginTop: 12, gap: 10 }}>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder="Project name"
              placeholderTextColor="#64748b"
              style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <TextInput
              value={form.status}
              onChangeText={(value) => setForm((prev) => ({ ...prev, status: value as ProjectItem['status'] }))}
              placeholder="Status"
              placeholderTextColor="#64748b"
              style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <TextInput
              value={form.startDate}
              onChangeText={(value) => setForm((prev) => ({ ...prev, startDate: value }))}
              placeholder="Start date"
              placeholderTextColor="#64748b"
              style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <TextInput
              value={form.endDate}
              onChangeText={(value) => setForm((prev) => ({ ...prev, endDate: value }))}
              placeholder="End date"
              placeholderTextColor="#64748b"
              style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <TextInput
              value={form.budgetTotal}
              onChangeText={(value) => setForm((prev) => ({ ...prev, budgetTotal: value }))}
              placeholder="Budget total"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <TextInput
              value={form.notes}
              onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
              placeholder="Notes"
              placeholderTextColor="#64748b"
              style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
            />
            <TouchableOpacity
              onPress={save}
              style={{ backgroundColor: '#0ea5e9', padding: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#0f172a', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: '#94a3b8' }}>Start Date: {project.startDate ?? 'Not set'}</Text>
            <Text style={{ color: '#94a3b8' }}>End Date: {project.endDate ?? 'Not set'}</Text>
            <Text style={{ color: '#94a3b8' }}>
              Budget Total: {project.budgetTotal ? `$${project.budgetTotal}` : 'Not set'}
            </Text>
            <Text style={{ color: '#94a3b8' }}>Notes: {project.notes || 'None'}</Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
        <Text style={{ color: '#e2e8f0' }}>Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={{ color: '#94a3b8', marginTop: 8 }}>No tasks yet.</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={{ marginTop: 8 }}>
              <Text style={{ color: '#f8fafc' }}>{task.title}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>{task.status}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
        <Text style={{ color: '#e2e8f0' }}>Expenses</Text>
        {expenses.length === 0 ? (
          <Text style={{ color: '#94a3b8', marginTop: 8 }}>No expenses yet.</Text>
        ) : (
          expenses.map((expense) => (
            <View key={expense.id} style={{ marginTop: 8 }}>
              <Text style={{ color: '#f8fafc' }}>{expense.description ?? expense.categoryId}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                {expense.expenseDate} • ${expense.amount}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default ProjectDetailScreen;

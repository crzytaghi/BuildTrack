import { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getApiBase } from '../lib/api';
import type { ProjectItem, ProjectStatus } from '../types';

const API_BASE = getApiBase();

type Props = {
  token: string;
  onSelectProject: (id: string) => void;
  onLogout: () => void;
};

const ProjectsScreen = ({ token, onSelectProject, onLogout }: Props) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    status: 'planning' as ProjectStatus,
    startDate: '',
    endDate: '',
    budgetTotal: '',
    notes: '',
  });

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unable to load projects');
      const data = (await res.json()) as { data: ProjectItem[] };
      setProjects(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const createProject = async () => {
    if (!form.name.trim()) {
      setError('Project name is required');
      return;
    }
    setError(null);
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
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
    if (!res.ok) {
      setError('Unable to create project');
      return;
    }
    const data = (await res.json()) as { data: ProjectItem };
    setProjects((prev) => [data.data, ...prev]);
    setForm({ name: '', status: 'planning', startDate: '', endDate: '', budgetTotal: '', notes: '' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1118', padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700' }}>Projects</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={{ color: '#e2e8f0' }}>Log out</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ marginTop: 12, backgroundColor: '#7f1d1d', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fecaca' }}>{error}</Text>
        </View>
      )}

      <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
        <Text style={{ color: '#e2e8f0', marginBottom: 10 }}>New Project</Text>
        <TextInput
          value={form.name}
          onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="Project name"
          placeholderTextColor="#64748b"
          style={{ backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
        />
        <TextInput
          value={form.status}
          onChangeText={(value) => setForm((prev) => ({ ...prev, status: value as ProjectStatus }))}
          placeholder="Status (planning/active/on_hold/completed)"
          placeholderTextColor="#64748b"
          style={{ marginTop: 12, backgroundColor: '#111827', color: '#f8fafc', padding: 12, borderRadius: 12 }}
        />
        <TouchableOpacity
          onPress={createProject}
          style={{ marginTop: 12, backgroundColor: '#0ea5e9', padding: 12, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#0f172a', fontWeight: '700' }}>Create Project</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, marginTop: 16 }}>
        {loading ? (
          <Text style={{ color: '#94a3b8' }}>Loading projects...</Text>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelectProject(item.id)}
                style={{ backgroundColor: '#111827', padding: 12, borderRadius: 12, marginBottom: 10 }}
              >
                <Text style={{ color: '#f8fafc', fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>{item.status}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default ProjectsScreen;

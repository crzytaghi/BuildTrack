import { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../lib/api';
import { colors, spacing, radius, fontSize } from '../theme';
import type { ProjectItem, ProjectStatus } from '../types';
import type { ProjectsStackParamList } from '../navigation/ProjectsStack';

const API_BASE = getApiBase();

type Nav = NativeStackNavigationProp<ProjectsStackParamList, 'ProjectsList'>;

const STATUS_OPTIONS: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed'];
const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
};

const ProjectsScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation<Nav>();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <View style={{ flex: 1, padding: spacing.xl }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }}>Projects</Text>
          <TouchableOpacity
            onPress={() => setShowForm((v) => !v)}
            style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md }}
          >
            <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: fontSize.sm }}>
              {showForm ? 'Cancel' : '+ New'}
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={{ marginBottom: spacing.md, backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm }}>
            <Text style={{ color: colors.errorText }}>{error}</Text>
          </View>
        )}

        {/* New project form */}
        {showForm && (
          <View style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg }}>
            <Text style={{ color: colors.textLabel, marginBottom: spacing.md }}>New Project</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Project name *"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setForm((p) => ({ ...p, status: s }))}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: form.status === s ? colors.primary : colors.inputBg,
                  }}
                >
                  <Text style={{ color: form.status === s ? colors.primaryText : colors.textLabel, fontSize: fontSize.sm }}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={form.budgetTotal}
              onChangeText={(v) => setForm((p) => ({ ...p, budgetTotal: v }))}
              placeholder="Budget total"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={{ marginTop: spacing.md, backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md }}
            />
            <TextInput
              value={form.notes}
              onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
              placeholder="Notes"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ marginTop: spacing.md, backgroundColor: colors.inputBg, color: colors.textPrimary, padding: spacing.md, borderRadius: radius.md, minHeight: 72 }}
            />
            <TouchableOpacity
              onPress={createProject}
              style={{ marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Create Project</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Project list */}
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading projects...</Text>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
                style={{ backgroundColor: colors.cardBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: fontSize.md }}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
                  {STATUS_LABELS[item.status]}
                  {item.budgetTotal ? ` • $${item.budgetTotal.toLocaleString()}` : ''}
                </Text>
                {(item.startDate || item.endDate) && (
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs }}>
                    {item.startDate ?? '—'} → {item.endDate ?? '—'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProjectsScreen;

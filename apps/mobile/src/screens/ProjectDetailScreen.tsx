import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../lib/api';
import { colors, spacing, radius, fontSize } from '../theme';
import type { ProjectItem, TaskItem, ExpenseItem } from '../types';
import type { ProjectsStackParamList } from '../navigation/ProjectsStack';
import OverviewTab from './project-detail/OverviewTab';
import TasksTab from './project-detail/TasksTab';
import ExpensesTab from './project-detail/ExpensesTab';
import BudgetTab from './project-detail/BudgetTab';
import DocumentsTab from './project-detail/DocumentsTab';

const API_BASE = getApiBase();

type ProjectTab = 'overview' | 'tasks' | 'expenses' | 'budget' | 'documents';
const TABS: { key: ProjectTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'budget', label: 'Budget' },
  { key: 'documents', label: 'Documents' },
];

type Nav = NativeStackNavigationProp<ProjectsStackParamList, 'ProjectDetail'>;
type Route = RouteProp<ProjectsStackParamList, 'ProjectDetail'>;

const ProjectDetailScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { projectId } = route.params;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
        <View style={{ padding: spacing.xl }}>
          <Text style={{ color: colors.textSecondary }}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
        <View style={{ padding: spacing.xl }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.link }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.errorText }}>{error ?? 'Project not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.sm }}>
          <Text style={{ color: colors.link, fontSize: fontSize.sm }}>← Projects</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' }} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
          {project.status.replace('_', ' ')}
        </Text>
      </View>

      {/* Tab bar — horizontal scroll so all 5 tabs fit on narrow screens */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginRight: spacing.xs,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
            }}
          >
            <Text style={{
              color: activeTab === tab.key ? colors.primary : colors.textSecondary,
              fontWeight: activeTab === tab.key ? '600' : '400',
              fontSize: fontSize.sm,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewTab project={project} tasks={tasks} expenses={expenses} onNavigateToTab={setActiveTab} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab project={project} tasks={tasks} setTasks={setTasks} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab project={project} expenses={expenses} setExpenses={setExpenses} />
        )}
        {activeTab === 'budget' && <BudgetTab project={project} />}
        {activeTab === 'documents' && <DocumentsTab project={project} />}
      </View>
    </SafeAreaView>
  );
};

export default ProjectDetailScreen;

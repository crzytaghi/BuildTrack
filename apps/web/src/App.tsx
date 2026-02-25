import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import AuthCard from './components/AuthCard';
import AuthLogin from './components/AuthLogin';
import AuthSignup from './components/AuthSignup';
import CompanySetupScreen from './components/CompanySetupScreen';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import TasksView from './components/TasksView';
import { getApiBase } from './lib/api';
import type { ProjectFormState, ProjectItem, ProjectStatus, TaskItem } from './types/projects';

type User = { id: string; email: string; name: string };

type AuthResponse = { token: string; user: User };

const API_BASE = getApiBase();

const nav = [
  'Dashboard',
  'Projects',
  'Tasks',
  'Budget',
  'Expenses',
  'Documents',
  'Reports',
  'Settings',
];

const kpis = [
  { label: 'Total Budget', value: '$1.42M', tone: 'bg-emerald-400' },
  { label: 'Actual Spend', value: '$620k', tone: 'bg-amber-400' },
  { label: 'Variance', value: '$800k', tone: 'bg-sky-400' },
  { label: 'Active Projects', value: '4', tone: 'bg-violet-400' },
];

const getStoredToken = () => localStorage.getItem('bt_token');

const AppShell = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    name: '',
    status: 'planning' as ProjectStatus,
    startDate: '',
    endDate: '',
    budgetTotal: '',
    notes: '',
  });
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companySetupRequired, setCompanySetupRequired] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskFilters, setTaskFilters] = useState({
    projectId: '',
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectId: '',
    status: '' as TaskItem['status'] | '',
    dueDate: '',
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [taskSubmitAttempted, setTaskSubmitAttempted] = useState(false);

  useEffect(() => {
    const init = async () => {
      const currentToken = getStoredToken();
      if (!currentToken) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setToken(currentToken);
        const companyRes = await fetch(`${API_BASE}/company/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (companyRes.ok) {
          const companyData = (await companyRes.json()) as {
            company: { name: string; companySetupComplete: boolean } | null;
          };
          if (companyData.company?.companySetupComplete) {
            setCompanyName(companyData.company.name);
            setCompanySetupRequired(false);
          } else {
            setCompanySetupRequired(true);
          }
        }
      } catch {
        localStorage.removeItem('bt_token');
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!token || !user || (location.pathname !== '/projects' && location.pathname !== '/tasks')) return;
    const load = async () => {
      if (location.pathname === '/projects') {
        setProjectsLoading(true);
        setProjectsError(null);
      }
      try {
        const res = await fetch(`${API_BASE}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load projects');
        const data = (await res.json()) as { data: ProjectItem[] };
        setProjects(data.data);
      } catch (err) {
        setProjectsError(err instanceof Error ? err.message : 'Unable to load projects');
      } finally {
        if (location.pathname === '/projects') {
          setProjectsLoading(false);
        }
      }
    };
    load();
  }, [location.pathname, token, user]);

  useEffect(() => {
    if (!token || !user || location.pathname !== '/tasks') return;
    if (location.search) {
      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId') ?? '';
      if (projectId && projectId !== taskFilters.projectId) {
        setTaskFilters((prev) => ({ ...prev, projectId }));
      }
    }
    const loadTasks = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const params = new URLSearchParams();
        if (taskFilters.projectId) params.set('projectId', taskFilters.projectId);
        if (taskFilters.status) params.set('status', taskFilters.status);
        if (taskFilters.fromDate) params.set('fromDate', taskFilters.fromDate);
        if (taskFilters.toDate) params.set('toDate', taskFilters.toDate);
        const res = await fetch(`${API_BASE}/tasks?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load tasks');
        const data = (await res.json()) as { data: TaskItem[] };
        setTasks(data.data);
      } catch (err) {
        setTasksError(err instanceof Error ? err.message : 'Unable to load tasks');
      } finally {
        setTasksLoading(false);
      }
    };
    loadTasks();
  }, [location.pathname, taskFilters, token, user]);

  const handleAuth = async (path: 'login' | 'signup', payload: Record<string, string>) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid credentials');
        if (res.status === 409) throw new Error('Email already in use');
        throw new Error(data.error ?? 'Authentication failed');
      }
      const data = (await res.json()) as AuthResponse;
      localStorage.setItem('bt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (path === 'signup') {
        setCompanySetupRequired(true);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Unable to reach the API. Is it running on port 4000?');
      }
      throw err;
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budgetTotal: '',
      notes: '',
    });
  };

  const handleProjectSubmit = async () => {
    if (!token) return;
    setProjectsError(null);
    const payload = {
      name: projectForm.name.trim(),
      status: projectForm.status,
      startDate: projectForm.startDate || undefined,
      endDate: projectForm.endDate || undefined,
      budgetTotal: projectForm.budgetTotal ? Number(projectForm.budgetTotal) : undefined,
      notes: projectForm.notes || undefined,
    };
    if (!payload.name) {
      setProjectsError('Project name is required');
      return;
    }
    const url = `${API_BASE}/projects`;
    const method = 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setProjectsError('Unable to save project');
      return;
    }
    const data = (await res.json()) as { data: ProjectItem };
    setProjects((prev) => [data.data, ...prev]);
    resetProjectForm();
  };

  const resetTaskForm = () => {
    setTaskForm({ title: '', projectId: '', status: '', dueDate: '' });
    setEditingTaskId(null);
    setTaskSubmitAttempted(false);
  };
  const closeTaskForm = () => {
    resetTaskForm();
    setTaskCreateOpen(false);
  };

  const handleTaskSubmit = async () => {
    if (!token) return;
    setTaskSubmitAttempted(true);
    setTasksError(null);
    if (!taskForm.title.trim()) {
      setTasksError('Task title is required');
      return;
    }
    if (!taskForm.projectId) {
      setTasksError('Project is required');
      return;
    }
    if (!editingTaskId && (!taskForm.status || !taskForm.dueDate)) {
      setTasksError('All fields are required to create a task');
      return;
    }
    if (editingTaskId && !taskForm.status) {
      setTasksError('Status is required');
      return;
    }
    const method = editingTaskId ? 'PATCH' : 'POST';
    const url = editingTaskId
      ? `${API_BASE}/tasks/${editingTaskId}`
      : `${API_BASE}/projects/${taskForm.projectId}/tasks`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: taskForm.title.trim(),
        status: taskForm.status,
        dueDate: taskForm.dueDate || undefined,
      }),
    });
    if (!res.ok) {
      setTasksError('Unable to save task');
      return;
    }
    const data = (await res.json()) as { data: TaskItem };
    setTasks((prev) => {
      if (editingTaskId) {
        return prev.map((item) => (item.id === data.data.id ? data.data : item));
      }
      return [data.data, ...prev];
    });
    closeTaskForm();
  };

  const selectTaskForEdit = (task: TaskItem) => {
    setTaskCreateOpen(true);
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      projectId: task.projectId,
      status: task.status,
      dueDate: task.dueDate ?? '',
    });
  };
  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    localStorage.removeItem('bt_token');
    setUser(null);
    setToken(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-slate-200">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ink text-slate-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
        <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6">
          <AuthCard
            title="BuildTrack"
            subtitle="Sign in to manage projects, budgets, and expenses."
            authView={authView}
            setAuthView={setAuthView}
            clearError={() => setError(null)}
            clearLoginFields={() => {
              setLoginEmail('');
              setLoginPassword('');
            }}
            clearSignupFields={() => {
              setSignupName('');
              setSignupEmail('');
              setSignupPassword('');
              setSignupConfirmPassword('');
            }}
            error={error}
          >
            {authView === 'login' ? (
              <AuthLogin
                email={loginEmail}
                password={loginPassword}
                onEmailChange={setLoginEmail}
                onPasswordChange={setLoginPassword}
                onSubmit={async () => {
                  try {
                    await handleAuth('login', { email: loginEmail, password: loginPassword });
                    setLoginEmail('');
                    setLoginPassword('');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Login failed');
                  }
                }}
              />
            ) : (
              <AuthSignup
                name={signupName}
                email={signupEmail}
                password={signupPassword}
                confirmPassword={signupConfirmPassword}
                onNameChange={setSignupName}
                onEmailChange={setSignupEmail}
                onPasswordChange={setSignupPassword}
                onConfirmPasswordChange={setSignupConfirmPassword}
                onSubmit={async () => {
                  try {
                    if (signupPassword !== signupConfirmPassword) {
                      setError('Passwords do not match');
                      return;
                    }
                    await handleAuth('signup', {
                      name: signupName,
                      email: signupEmail,
                      password: signupPassword,
                    });
                    setSignupName('');
                    setSignupEmail('');
                    setSignupPassword('');
                    setSignupConfirmPassword('');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Signup failed');
                  }
                }}
              />
            )}
          </AuthCard>
        </div>
      </div>
    );
  }

  if (companySetupRequired) {
    return (
      <CompanySetupScreen
        onSubmit={async (name) => {
          const res = await fetch(`${API_BASE}/company/setup`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) {
            return;
          }
          const data = (await res.json()) as {
            company: { name: string; companySetupComplete: boolean };
          };
          setCompanyName(data.company.name);
          setCompanySetupRequired(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
      <div className="md:grid md:grid-cols-[260px_1fr]">
        <aside className="hidden h-screen flex-col border-r border-slate-800 bg-[#0b1118] p-6 md:flex">
          <div>
            <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
            <div className="mt-10 space-y-2 text-sm">
              {nav.map((item) => (
                <Link
                  key={item}
                  to={item === 'Dashboard' ? '/' : `/${item.toLowerCase()}`}
                  className={`block rounded-lg px-3 py-2 ${
                    (item === 'Dashboard' && location.pathname === '/') ||
                    (item === 'Projects' && location.pathname.startsWith('/projects')) ||
                    (item !== 'Dashboard' && item !== 'Projects' && location.pathname === `/${item.toLowerCase()}`)
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <button
            className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            onClick={handleLogout}
          >
            Log out
          </button>
        </aside>
        <main className="min-h-screen">
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#0b1118] px-4 py-4 md:hidden">
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
              onClick={() => setMobileNavOpen(true)}
            >
              ☰
            </button>
            <div className="text-lg font-semibold font-display">BuildTrack</div>
            <div className="w-[40px]" />
          </div>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                className="absolute inset-0 bg-black/50"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="absolute left-0 top-0 h-full w-72 bg-[#0b1118] p-6 shadow-2xl">
                <div>
                  <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
                  <div className="mt-8 space-y-2 text-sm">
                    {nav.map((item) => (
                      <Link
                        key={item}
                        to={item === 'Dashboard' ? '/' : `/${item.toLowerCase()}`}
                        onClick={() => setMobileNavOpen(false)}
                        className={`block rounded-lg px-3 py-2 ${
                          (item === 'Dashboard' && location.pathname === '/') ||
                          (item === 'Projects' && location.pathname.startsWith('/projects')) ||
                          (item !== 'Dashboard' && item !== 'Projects' && location.pathname === `/${item.toLowerCase()}`)
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
                <button
                  className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleLogout();
                  }}
                >
                  Log out
                </button>
              </aside>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  userName={user?.name ?? 'Builder'}
                  companyName={companyName ?? 'Company'}
                  kpis={kpis}
                  headerActions={
                    <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow">
                      Export CSV
                    </button>
                  }
                />
              }
            />
            <Route
              path="/projects"
              element={
                <ProjectsView
                  projects={projects}
                  loading={projectsLoading}
                  error={projectsError}
                  form={projectForm}
                  onFormChange={setProjectForm}
                  onSubmit={handleProjectSubmit}
                  onViewProject={(id) => navigate(`/projects/${id}`)}
                />
              }
            />
            <Route
              path="/projects/:id"
              element={<ProjectDetailRoute token={token ?? ''} onLogout={handleLogout} />}
            />
            <Route
              path="/tasks"
              element={
                <TasksView
                  projects={projects}
                  tasks={tasks}
                  loading={tasksLoading}
                  error={tasksError}
                  filters={taskFilters}
                  form={taskForm}
                  createOpen={taskCreateOpen || Boolean(editingTaskId)}
                  submitAttempted={taskSubmitAttempted}
                  editingTaskId={editingTaskId}
                  onFilterChange={setTaskFilters}
                  onFormChange={setTaskForm}
                  onCreateTask={() => {
                    setTaskCreateOpen(true);
                    setEditingTaskId(null);
                    setTaskForm({ title: '', projectId: '', status: '', dueDate: '' });
                    setTaskSubmitAttempted(false);
                  }}
                  onSubmit={handleTaskSubmit}
                  onCancelEdit={closeTaskForm}
                  onEditTask={selectTaskForEdit}
                  onLogout={handleLogout}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const ProjectDetailRoute = ({ token, onLogout }: { token: string; onLogout: () => void }) => {
  const { id } = useParams();
  if (!id) return null;
  return <ProjectDetailView projectId={id} token={token} onLogout={onLogout} />;
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;

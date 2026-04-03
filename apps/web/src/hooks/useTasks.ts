import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { TaskItem, User } from '../types/projects';

const API_BASE = getApiBase();

export const useTasks = (token: string | null, user: User | null) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskFilters, setTaskFilters] = useState({ projectId: '', status: '', fromDate: '', toDate: '' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectId: '',
    status: '' as TaskItem['status'] | '',
    dueDate: '',
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [taskSubmitAttempted, setTaskSubmitAttempted] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || (location.pathname !== '/tasks' && location.pathname !== '/')) return;
    if (location.pathname === '/tasks' && location.search) {
      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId') ?? '';
      if (projectId && projectId !== taskFilters.projectId) {
        setTaskFilters((prev) => ({ ...prev, projectId }));
      }
    }
    const loadTasks = async () => {
      if (location.pathname === '/tasks') { setTasksLoading(true); setTasksError(null); }
      try {
        const params = new URLSearchParams();
        if (location.pathname === '/tasks') {
          if (taskFilters.projectId) params.set('projectId', taskFilters.projectId);
          if (taskFilters.status && taskFilters.status !== 'overdue') params.set('status', taskFilters.status);
          if (taskFilters.fromDate) params.set('fromDate', taskFilters.fromDate);
          if (taskFilters.toDate) params.set('toDate', taskFilters.toDate);
        }
        const res = await fetch(`${API_BASE}/tasks?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load tasks');
        const data = (await res.json()) as { data: TaskItem[] };
        const today = new Date().toISOString().split('T')[0];
        const filtered = taskFilters.status === 'overdue'
          ? data.data.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'done')
          : data.data;
        setTasks(filtered);
      } catch (err) {
        if (location.pathname === '/tasks') setTasksError(err instanceof Error ? err.message : 'Unable to load tasks');
      } finally {
        if (location.pathname === '/tasks') setTasksLoading(false);
      }
    };
    loadTasks();
  }, [location.pathname, taskFilters, token, user]);

  const resetTaskForm = () => {
    setTaskForm({ title: '', projectId: '', status: '', dueDate: '' });
    setEditingTaskId(null);
    setTaskSubmitAttempted(false);
  };

  const closeTaskForm = () => { resetTaskForm(); setTaskCreateOpen(false); };

  const handleTaskSubmit = async () => {
    if (!token) return;
    setTaskSubmitAttempted(true);
    setTasksError(null);
    if (!taskForm.title.trim()) { setTasksError('Task title is required'); return; }
    if (!taskForm.projectId) { setTasksError('Project is required'); return; }
    if (!editingTaskId && (!taskForm.status || !taskForm.dueDate)) {
      setTasksError('All fields are required to create a task');
      return;
    }
    if (editingTaskId && !taskForm.status) { setTasksError('Status is required'); return; }
    const method = editingTaskId ? 'PATCH' : 'POST';
    const url = editingTaskId
      ? `${API_BASE}/tasks/${editingTaskId}`
      : `${API_BASE}/projects/${taskForm.projectId}/tasks`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskForm.title.trim(),
        status: taskForm.status,
        dueDate: taskForm.dueDate || undefined,
      }),
    });
    if (!res.ok) { setTasksError('Unable to save task'); return; }
    const data = (await res.json()) as { data: TaskItem };
    setTasks((prev) =>
      editingTaskId ? prev.map((item) => (item.id === data.data.id ? data.data : item)) : [data.data, ...prev]
    );
    closeTaskForm();
  };

  const selectTaskForEdit = (task: TaskItem) => {
    setTaskCreateOpen(true);
    setEditingTaskId(task.id);
    setTaskForm({ title: task.title, projectId: task.projectId, status: task.status, dueDate: task.dueDate ?? '' });
  };

  const handleTaskDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeletingTaskId(null);
  };

  const handleFilterChange = (next: typeof taskFilters) => {
    setTaskFilters(next);
    const params = new URLSearchParams();
    if (next.projectId) params.set('projectId', next.projectId);
    if (next.status) params.set('status', next.status);
    if (next.fromDate) params.set('fromDate', next.fromDate);
    if (next.toDate) params.set('toDate', next.toDate);
    navigate({ pathname: '/tasks', search: params.size ? `?${params.toString()}` : '' }, { replace: true });
  };

  const onCreateTask = () => {
    setTaskCreateOpen(true);
    setEditingTaskId(null);
    setTaskForm({ title: '', projectId: '', status: '', dueDate: '' });
    setTaskSubmitAttempted(false);
  };

  return {
    tasks, tasksLoading, tasksError,
    taskFilters, taskForm, setTaskForm,
    editingTaskId, taskCreateOpen, setTaskCreateOpen,
    taskSubmitAttempted, deletingTaskId, setDeletingTaskId,
    handleTaskSubmit, handleTaskDelete, selectTaskForEdit,
    closeTaskForm, handleFilterChange, onCreateTask,
  };
};

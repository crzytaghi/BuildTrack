import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { ProjectFormState, ProjectItem, ProjectStatus, User } from '../types/projects';

const API_BASE = getApiBase();

const WATCHED_PATHS = ['/', '/projects', '/tasks', '/expenses', '/vendors', '/documents'];

export const useProjects = (token: string | null, user: User | null) => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || !WATCHED_PATHS.includes(location.pathname)) return;
    const load = async () => {
      if (location.pathname === '/projects') { setProjectsLoading(true); setProjectsError(null); }
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
        if (location.pathname === '/projects') setProjectsLoading(false);
      }
    };
    load();
  }, [location.pathname, token, user]);

  const resetProjectForm = () => {
    setProjectForm({ name: '', status: 'planning', startDate: '', endDate: '', budgetTotal: '', notes: '' });
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
    if (!payload.name) { setProjectsError('Project name is required'); return; }
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { setProjectsError('Unable to save project'); return; }
    const data = (await res.json()) as { data: ProjectItem };
    setProjects((prev) => [data.data, ...prev]);
    resetProjectForm();
  };

  const handleProjectDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingProjectId(null);
    navigate('/projects');
  };

  return {
    projects, projectsLoading, projectsError, setProjectsError,
    projectForm, setProjectForm,
    deletingProjectId, setDeletingProjectId,
    resetProjectForm, handleProjectSubmit, handleProjectDelete,
  };
};

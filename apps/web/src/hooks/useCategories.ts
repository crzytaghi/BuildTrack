import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { Category, User } from '../types/projects';

const API_BASE = getApiBase();

export const useCategories = (token: string | null, user: User | null) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [categorySubmitAttempted, setCategorySubmitAttempted] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || categories.length > 0) return;
    fetch(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: { data: Category[] }) => setCategories(data.data))
      .catch(() => null);
  }, [token, user, categories.length]);

  const closeCategoryForm = () => {
    setCategoryCreateOpen(false);
    setEditingCategoryId(null);
    setCategorySubmitAttempted(false);
    setCategoryForm({ name: '' });
    setCategoryError(null);
  };

  const handleCategorySubmit = async () => {
    if (!token) return;
    setCategorySubmitAttempted(true);
    if (!categoryForm.name.trim()) return;
    setCategoryError(null);
    const method = editingCategoryId ? 'PATCH' : 'POST';
    const url = editingCategoryId
      ? `${API_BASE}/categories/${editingCategoryId}`
      : `${API_BASE}/categories`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryForm.name.trim() }),
    });
    if (!res.ok) { setCategoryError('Unable to save category'); return; }
    const data = (await res.json()) as { data: Category };
    setCategories((prev) =>
      editingCategoryId ? prev.map((c) => (c.id === data.data.id ? data.data : c)) : [...prev, data.data]
    );
    closeCategoryForm();
  };

  const handleCategoryDelete = async (id: string) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setCategoryError(body.error ?? 'Unable to delete category');
      setDeletingCategoryId(null);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeletingCategoryId(null);
  };

  const onCreateCategory = () => {
    setCategoryCreateOpen(true);
    setEditingCategoryId(null);
    setCategoryForm({ name: '' });
    setCategorySubmitAttempted(false);
  };

  const onEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setCategoryCreateOpen(true);
    setCategoryForm({ name: c.name });
  };

  return {
    categories,
    categoryCreateOpen, setCategoryCreateOpen,
    categorySubmitAttempted, setCategorySubmitAttempted,
    editingCategoryId, setEditingCategoryId,
    deletingCategoryId, setDeletingCategoryId,
    categoryForm, setCategoryForm,
    categoryError,
    closeCategoryForm, handleCategorySubmit, handleCategoryDelete,
    onCreateCategory, onEditCategory,
  };
};

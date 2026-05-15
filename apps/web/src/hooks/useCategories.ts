import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { Category, User } from '../types/projects';

const API_BASE = getApiBase();

export const useCategories = (token: string | null, user: User | null) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!token || !user || categories.length > 0) return;
    fetch(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: { data: Category[] }) => setCategories(data.data))
      .catch(() => null);
  }, [token, user, categories.length]);

  return { categories, setCategories };
};

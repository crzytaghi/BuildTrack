import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { User, VendorFormState, VendorItem } from '../types/projects';

const API_BASE = getApiBase();

export const useVendors = (token: string | null, user: User | null) => {
  const location = useLocation();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorFormState>({
    name: '', trade: '', contactName: '', phone: '', email: '', notes: '',
  });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorCreateOpen, setVendorCreateOpen] = useState(false);
  const [vendorSubmitAttempted, setVendorSubmitAttempted] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  // Full load with loading state when on the vendors page
  useEffect(() => {
    if (!token || !user || (location.pathname !== '/vendors' && location.pathname !== '/')) return;
    const loadVendors = async () => {
      if (location.pathname === '/vendors') { setVendorsLoading(true); setVendorsError(null); }
      try {
        const res = await fetch(`${API_BASE}/vendors`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Unable to load vendors');
        const data = (await res.json()) as { data: VendorItem[] };
        setVendors(data.data);
      } catch (err) {
        if (location.pathname === '/vendors')
          setVendorsError(err instanceof Error ? err.message : 'Unable to load vendors');
      } finally {
        if (location.pathname === '/vendors') setVendorsLoading(false);
      }
    };
    loadVendors();
  }, [location.pathname, token, user]);

  // Pre-load vendors once for form dropdowns on other pages
  useEffect(() => {
    if (!token || !user || vendors.length > 0) return;
    fetch(`${API_BASE}/vendors`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: { data: VendorItem[] }) => setVendors(data.data))
      .catch(() => null);
  }, [token, user, vendors.length]);

  const resetVendorForm = () => {
    setVendorForm({ name: '', trade: '', contactName: '', phone: '', email: '', notes: '' });
    setEditingVendorId(null);
    setVendorSubmitAttempted(false);
  };

  const closeVendorForm = () => { resetVendorForm(); setVendorCreateOpen(false); };

  const handleVendorSubmit = async () => {
    if (!token) return;
    setVendorSubmitAttempted(true);
    setVendorsError(null);
    if (!vendorForm.name.trim()) { setVendorsError('Vendor name is required'); return; }
    const method = editingVendorId ? 'PATCH' : 'POST';
    const url = editingVendorId ? `${API_BASE}/vendors/${editingVendorId}` : `${API_BASE}/vendors`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: vendorForm.name.trim(),
        trade: vendorForm.trade || undefined,
        contactName: vendorForm.contactName || undefined,
        phone: vendorForm.phone || undefined,
        email: vendorForm.email || undefined,
        notes: vendorForm.notes || undefined,
      }),
    });
    if (!res.ok) { setVendorsError('Unable to save vendor'); return; }
    const data = (await res.json()) as { data: VendorItem };
    setVendors((prev) =>
      editingVendorId ? prev.map((item) => (item.id === data.data.id ? data.data : item)) : [data.data, ...prev]
    );
    closeVendorForm();
  };

  const selectVendorForEdit = (vendor: VendorItem) => {
    setVendorCreateOpen(true);
    setEditingVendorId(vendor.id);
    setVendorForm({
      name: vendor.name,
      trade: vendor.trade ?? '',
      contactName: vendor.contactName ?? '',
      phone: vendor.phone ?? '',
      email: vendor.email ?? '',
      notes: vendor.notes ?? '',
    });
  };

  const handleVendorDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setVendors((prev) => prev.filter((v) => v.id !== id));
    setDeletingVendorId(null);
  };

  const onCreateVendor = () => {
    setVendorCreateOpen(true);
    setEditingVendorId(null);
    setVendorForm({ name: '', trade: '', contactName: '', phone: '', email: '', notes: '' });
    setVendorSubmitAttempted(false);
  };

  return {
    vendors, vendorsLoading, vendorsError,
    vendorForm, setVendorForm,
    editingVendorId, vendorCreateOpen, setVendorCreateOpen,
    vendorSubmitAttempted, deletingVendorId, setDeletingVendorId,
    handleVendorSubmit, handleVendorDelete, selectVendorForEdit,
    closeVendorForm, onCreateVendor,
  };
};

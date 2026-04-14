import { useEffect, useRef, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { DocumentItem, DocumentType, ProjectItem } from '../types/projects';

const API_BASE = getApiBase();

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'permit', label: 'Permit' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'photo', label: 'Photo' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
];

const TYPE_COLORS: Record<DocumentType, string> = {
  contract: 'bg-violet-500/20 text-violet-300',
  permit: 'bg-amber-500/20 text-amber-300',
  drawing: 'bg-sky-500/20 text-sky-300',
  invoice: 'bg-emerald-500/20 text-emerald-300',
  photo: 'bg-pink-500/20 text-pink-300',
  report: 'bg-orange-500/20 text-orange-300',
  other: 'bg-slate-500/20 text-slate-300',
};

const fmtBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const uploadToR2 = (url: string, file: File, onProgress: (pct: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () =>
      xhr.status < 400 ? resolve() : reject(new Error('Upload to storage failed'))
    );
    xhr.addEventListener('error', () => reject(new Error('Upload to storage failed')));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });

type Props = {
  token: string;
  projects: ProjectItem[];
};

const DocumentsView = ({ token, projects }: Props) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'other' as DocumentType,
    projectId: '',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectFilter) params.set('projectId', projectFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`${API_BASE}/documents?${params}`, { headers: authHeaders });
      if (!res.ok) throw new Error('Unable to load documents');
      const data = (await res.json()) as { data: DocumentItem[] };
      setDocuments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, [projectFilter, typeFilter]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadForm((prev) => ({ ...prev, title: file.name.replace(/\.[^.]+$/, '') }));
    setUploadOpen(true);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title.trim()) {
      setUploadError('Title is required');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds 50 MB limit');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      const urlRes = await fetch(`${API_BASE}/documents/upload-url`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileSize: selectedFile.size,
          projectId: uploadForm.projectId || undefined,
        }),
      });
      if (!urlRes.ok) throw new Error('Unable to get upload URL');
      const { uploadUrl, fileKey } = (await urlRes.json()) as { uploadUrl: string; fileKey: string };

      await uploadToR2(uploadUrl, selectedFile, setUploadProgress);

      const docRes = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey,
          title: uploadForm.title.trim(),
          type: uploadForm.type,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || 'application/octet-stream',
          projectId: uploadForm.projectId || undefined,
          notes: uploadForm.notes || undefined,
        }),
      });
      if (!docRes.ok) throw new Error('Unable to save document record');
      const { data } = (await docRes.json()) as { data: DocumentItem };
      setDocuments((prev) => [data, ...prev]);
      closeUploadForm();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadForm = () => {
    setUploadOpen(false);
    setSelectedFile(null);
    setUploadForm({ title: '', type: 'other', projectId: '', notes: '' });
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (doc: DocumentItem) => {
    const res = await fetch(`${API_BASE}/documents/${doc.id}/url`, { headers: authHeaders });
    if (!res.ok) return;
    const { url } = (await res.json()) as { url: string };
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE', headers: authHeaders });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-100">Documents</div>
          <div className="text-sm text-slate-400">Store and manage project files.</div>
        </div>
        {!uploadOpen && (
          <button
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload File
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />
      </div>

      {/* Upload form */}
      {uploadOpen && selectedFile && (
        <div className="rounded-2xl border border-slate-800 bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">New Document</div>
            <button className="text-xs uppercase tracking-wide text-slate-400" onClick={closeUploadForm}>
              Cancel
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3 text-sm">
            <span className="text-slate-400">📄</span>
            <div>
              <div className="text-slate-200">{selectedFile.name}</div>
              <div className="text-xs text-slate-500">{fmtBytes(selectedFile.size)}</div>
            </div>
          </div>
          {uploadError && (
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {uploadError}
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={uploadForm.title}
              onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Document title"
              className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${uploadError && !uploadForm.title.trim() ? 'ring-red-500/60' : ''}`}
            />
            <select
              value={uploadForm.type}
              onChange={(e) => setUploadForm((p) => ({ ...p, type: e.target.value as DocumentType }))}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={uploadForm.projectId}
              onChange={(e) => setUploadForm((p) => ({ ...p, projectId: e.target.value }))}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            >
              <option value="">No project (general)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              value={uploadForm.notes}
              onChange={(e) => setUploadForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Notes (optional)"
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 sm:col-span-2 lg:col-span-3"
            />
          </div>
          {uploading ? (
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950"
              onClick={handleUpload}
            >
              Upload
            </button>
          )}
        </div>
      )}

      {/* Drag & drop zone */}
      {!uploadOpen && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-8 py-10 text-center transition-colors ${
            dragOver ? 'border-accent bg-accent/5' : 'border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="text-2xl">📁</div>
          <div className="mt-2 text-sm text-slate-400">
            Drag & drop a file here, or <span className="text-accent">click to browse</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Max 50 MB per file</div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-xl bg-surface px-4 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl bg-surface px-4 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800"
        >
          <option value="">All Types</option>
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Document list */}
      <div className="rounded-2xl bg-panel shadow-lg">
        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">Loading…</div>
        ) : error ? (
          <div className="px-6 py-4 text-sm text-red-300">{error}</div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            No documents yet. Upload your first file above.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {documents.map((doc) => {
              const projectName = projects.find((p) => p.id === doc.projectId)?.name;
              return (
                <div key={doc.id} className="flex items-center justify-between px-6 py-4">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-slate-100 truncate">{doc.title}</div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[doc.type]}`}>
                        {DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {doc.fileName} • {fmtBytes(doc.fileSize)}
                      {projectName && ` • ${projectName}`}
                      {doc.notes && ` • ${doc.notes}`}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                      onClick={() => handleDownload(doc)}
                    >
                      Download
                    </button>
                    {deletingId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Are you sure?</span>
                        <button className="text-xs text-red-300" onClick={() => handleDelete(doc.id)}>Confirm</button>
                        <button className="text-xs text-slate-400" onClick={() => setDeletingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-slate-500 hover:text-red-400"
                        onClick={() => setDeletingId(doc.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsView;

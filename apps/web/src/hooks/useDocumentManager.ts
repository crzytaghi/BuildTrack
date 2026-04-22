import { useEffect, useRef, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { DocumentItem, DocumentType } from '../types/projects';

const API_BASE = getApiBase();

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

export interface DocumentManagerResult {
  documents:         DocumentItem[];
  docsLoading:       boolean;
  docsError:         string | null;
  docUploadOpen:     boolean;
  docDragOver:       boolean;
  setDocDragOver:    React.Dispatch<React.SetStateAction<boolean>>;
  selectedFile:      File | null;
  docForm:           { title: string; type: DocumentType; notes: string };
  setDocForm:        React.Dispatch<React.SetStateAction<{ title: string; type: DocumentType; notes: string }>>;
  docUploading:      boolean;
  docUploadProgress: number;
  docUploadError:    string | null;
  docDeletingId:     string | null;
  setDocDeletingId:  React.Dispatch<React.SetStateAction<string | null>>;
  docFileInputRef:   React.RefObject<HTMLInputElement>;
  handleDocFileSelect:  (file: File) => void;
  closeDocUploadForm:   () => void;
  handleDocUpload:      () => Promise<void>;
  handleDocDownload:    (doc: DocumentItem) => Promise<void>;
  handleDocDelete:      (id: string) => Promise<void>;
}

export const useDocumentManager = (
  projectId: string,
  token: string,
  activeTab: string,
): DocumentManagerResult => {
  const [documents,         setDocuments]         = useState<DocumentItem[]>([]);
  const [docsLoading,       setDocsLoading]       = useState(false);
  const [docsError,         setDocsError]         = useState<string | null>(null);
  const [docUploadOpen,     setDocUploadOpen]     = useState(false);
  const [docDragOver,       setDocDragOver]       = useState(false);
  const [selectedFile,      setSelectedFile]      = useState<File | null>(null);
  const [docForm,           setDocForm]           = useState<{ title: string; type: DocumentType; notes: string }>({ title: '', type: 'other', notes: '' });
  const [docUploading,      setDocUploading]      = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const [docUploadError,    setDocUploadError]    = useState<string | null>(null);
  const [docDeletingId,     setDocDeletingId]     = useState<string | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const res = await fetch(`${API_BASE}/documents?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unable to load documents');
      const data = (await res.json()) as { data: DocumentItem[] };
      setDocuments(data.data);
    } catch (err) {
      setDocsError(err instanceof Error ? err.message : 'Unable to load documents');
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') loadDocuments();
  }, [activeTab, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDocFileSelect = (file: File) => {
    setSelectedFile(file);
    setDocForm((prev) => ({ ...prev, title: file.name.replace(/\.[^.]+$/, '') }));
    setDocUploadOpen(true);
    setDocUploadError(null);
  };

  const closeDocUploadForm = () => {
    setDocUploadOpen(false);
    setSelectedFile(null);
    setDocForm({ title: '', type: 'other', notes: '' });
    setDocUploadProgress(0);
    setDocUploadError(null);
    if (docFileInputRef.current) docFileInputRef.current.value = '';
  };

  const handleDocUpload = async () => {
    if (!selectedFile || !docForm.title.trim()) { setDocUploadError('Title is required'); return; }
    if (selectedFile.size > 50 * 1024 * 1024)   { setDocUploadError('File exceeds 50 MB limit'); return; }
    setDocUploading(true);
    setDocUploadProgress(0);
    setDocUploadError(null);
    try {
      const urlRes = await fetch(`${API_BASE}/documents/upload-url`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile.name, mimeType: selectedFile.type || 'application/octet-stream', fileSize: selectedFile.size, projectId }),
      });
      if (!urlRes.ok) throw new Error('Unable to get upload URL');
      const { uploadUrl, fileKey } = (await urlRes.json()) as { uploadUrl: string; fileKey: string };
      await uploadToR2(uploadUrl, selectedFile, setDocUploadProgress);
      const docRes = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, title: docForm.title.trim(), type: docForm.type, fileName: selectedFile.name, fileSize: selectedFile.size, mimeType: selectedFile.type || 'application/octet-stream', projectId, notes: docForm.notes || undefined }),
      });
      if (!docRes.ok) throw new Error('Unable to save document record');
      const { data } = (await docRes.json()) as { data: DocumentItem };
      setDocuments((prev) => [data, ...prev]);
      closeDocUploadForm();
    } catch (err) {
      setDocUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDocDownload = async (doc: DocumentItem) => {
    const res = await fetch(`${API_BASE}/documents/${doc.id}/url`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const { url } = (await res.json()) as { url: string };
    window.open(url, '_blank');
  };

  const handleDocDelete = async (id: string) => {
    await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setDocDeletingId(null);
  };

  return {
    documents, docsLoading, docsError,
    docUploadOpen, docDragOver, setDocDragOver,
    selectedFile, docForm, setDocForm,
    docUploading, docUploadProgress, docUploadError,
    docDeletingId, setDocDeletingId,
    docFileInputRef,
    handleDocFileSelect, closeDocUploadForm, handleDocUpload, handleDocDownload, handleDocDelete,
  };
};

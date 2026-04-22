import type { DocumentType } from '../../types/projects';
import type { DocumentManagerResult } from '../../hooks/useDocumentManager';

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'permit',   label: 'Permit' },
  { value: 'drawing',  label: 'Drawing' },
  { value: 'invoice',  label: 'Invoice' },
  { value: 'photo',    label: 'Photo' },
  { value: 'report',   label: 'Report' },
  { value: 'other',    label: 'Other' },
];

const TYPE_COLORS: Record<DocumentType, string> = {
  contract: 'bg-violet-500/20 text-violet-300',
  permit:   'bg-amber-500/20 text-amber-300',
  drawing:  'bg-sky-500/20 text-sky-300',
  invoice:  'bg-emerald-500/20 text-emerald-300',
  photo:    'bg-pink-500/20 text-pink-300',
  report:   'bg-orange-500/20 text-orange-300',
  other:    'bg-slate-500/20 text-slate-300',
};

const fmtBytes = (bytes: number) => {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type Props = DocumentManagerResult;

const DocumentsTab = ({
  documents, docsLoading, docsError,
  docUploadOpen, docDragOver, setDocDragOver,
  selectedFile, docForm, setDocForm,
  docUploading, docUploadProgress, docUploadError,
  docDeletingId, setDocDeletingId,
  docFileInputRef,
  handleDocFileSelect, closeDocUploadForm, handleDocUpload, handleDocDownload, handleDocDelete,
}: Props) => {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-200">Documents</div>
          <div className="text-xs text-slate-400">Files attached to this project.</div>
        </div>
        {!docUploadOpen && (
          <button
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
            onClick={() => docFileInputRef.current?.click()}
          >
            Upload File
          </button>
        )}
        <input
          ref={docFileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocFileSelect(f); }}
        />
      </div>

      {/* Upload form */}
      {docUploadOpen && selectedFile && (
        <div className="rounded-2xl border border-slate-800 bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">New Document</div>
            <button className="text-xs uppercase tracking-wide text-slate-400" onClick={closeDocUploadForm}>Cancel</button>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3 text-sm">
            <span className="text-slate-400">📄</span>
            <div>
              <div className="text-slate-200">{selectedFile.name}</div>
              <div className="text-xs text-slate-500">{fmtBytes(selectedFile.size)}</div>
            </div>
          </div>
          {docUploadError && (
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{docUploadError}</div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <input
              value={docForm.title}
              onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Document title"
              className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${docUploadError && !docForm.title.trim() ? 'ring-red-500/60' : ''}`}
            />
            <select
              value={docForm.type}
              onChange={(e) => setDocForm((p) => ({ ...p, type: e.target.value as DocumentType }))}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            >
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              value={docForm.notes}
              onChange={(e) => setDocForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Notes (optional)"
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 sm:col-span-2"
            />
          </div>
          {docUploading ? (
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Uploading…</span>
                <span>{docUploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${docUploadProgress}%` }} />
              </div>
            </div>
          ) : (
            <button className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950" onClick={handleDocUpload}>
              Upload
            </button>
          )}
        </div>
      )}

      {/* Drag & drop zone */}
      {!docUploadOpen && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDocDragOver(true); }}
          onDragLeave={() => setDocDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDocDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleDocFileSelect(f); }}
          onClick={() => docFileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-8 py-10 text-center transition-colors ${docDragOver ? 'border-accent bg-accent/5' : 'border-slate-700 hover:border-slate-500'}`}
        >
          <div className="text-2xl">📁</div>
          <div className="mt-2 text-sm text-slate-400">
            Drag & drop a file here, or <span className="text-accent">click to browse</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Max 50 MB per file</div>
        </div>
      )}

      {/* Document list */}
      <div className="rounded-2xl bg-panel shadow-lg">
        {docsLoading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">Loading…</div>
        ) : docsError ? (
          <div className="px-6 py-4 text-sm text-red-300">{docsError}</div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">No documents yet. Upload your first file above.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-slate-100 truncate">{doc.title}</div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[doc.type]}`}>
                      {DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {doc.fileName} • {fmtBytes(doc.fileSize)}{doc.notes && ` • ${doc.notes}`}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                    onClick={() => handleDocDownload(doc)}
                  >
                    Download
                  </button>
                  {docDeletingId === doc.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Are you sure?</span>
                      <button className="text-xs text-red-300" onClick={() => handleDocDelete(doc.id)}>Confirm</button>
                      <button className="text-xs text-slate-400" onClick={() => setDocDeletingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="text-xs text-slate-500 hover:text-red-400" onClick={() => setDocDeletingId(doc.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;

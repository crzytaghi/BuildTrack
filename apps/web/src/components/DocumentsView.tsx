const DocumentsView = () => (
  <>
    <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div>
        <div className="text-2xl font-semibold font-display">Documents</div>
        <div className="text-sm text-slate-400">Store and manage project documents.</div>
      </div>
    </header>

    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-panel p-10 shadow-lg text-center">
        <div className="text-4xl mb-4">📄</div>
        <div className="text-sm font-semibold text-slate-200">Document management coming soon</div>
        <div className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
          Attach contracts, permits, drawings, and other files directly to your projects. File upload and storage support is planned for a future release.
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 text-xs text-slate-500 sm:grid-cols-3 max-w-lg mx-auto">
          {['Attach files to projects', 'Organize by document type', 'Share with your team'].map((f) => (
            <div key={f} className="rounded-xl border border-slate-800 px-4 py-3 text-slate-400">{f}</div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default DocumentsView;

import { useState } from 'react';

type Props = {
  onSubmit: (name: string) => Promise<void> | void;
};

const CompanySetupScreen = ({ onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl bg-panel p-8 shadow-xl">
          <div className="text-2xl font-semibold font-display">Set Up Your Company</div>
          <div className="mt-1 text-sm text-slate-400">
            This is a placeholder for MVP onboarding. We’ll store this locally for now.
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="mt-6">
            <label className="text-xs uppercase tracking-wide text-slate-400">Company Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Builders"
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <button
            className="mt-6 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
            onClick={async () => {
              if (!name.trim()) {
                setError('Company name is required');
                return;
              }
              setError(null);
              await onSubmit(name.trim());
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySetupScreen;

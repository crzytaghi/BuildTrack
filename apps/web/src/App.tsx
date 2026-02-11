const nav = [
  'Dashboard',
  'Projects',
  'Tasks',
  'Budget',
  'Expenses',
  'Documents',
  'Reports',
  'Settings',
];

const kpis = [
  { label: 'Total Budget', value: '$1.42M', tone: 'bg-emerald-400' },
  { label: 'Actual Spend', value: '$620k', tone: 'bg-amber-400' },
  { label: 'Variance', value: '$800k', tone: 'bg-sky-400' },
  { label: 'Active Projects', value: '4', tone: 'bg-violet-400' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
      <div className="grid grid-cols-[260px_1fr]">
        <aside className="h-screen border-r border-slate-800 bg-[#0b1118] p-6">
          <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
          <div className="mt-10 space-y-2 text-sm">
            {nav.map((item) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 ${
                  item === 'Dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
        <main className="min-h-screen">
          <header className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div>
              <div className="text-2xl font-semibold font-display">Dashboard</div>
              <div className="text-sm text-slate-400">Residential build overview</div>
            </div>
            <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow">
              Export CSV
            </button>
          </header>
          <section className="grid grid-cols-4 gap-6 px-8 py-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl bg-surface p-5 shadow-lg">
                <div className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</div>
                <div className="mt-3 text-2xl font-semibold">{kpi.value}</div>
                <div className={`mt-4 h-2 w-16 rounded-full ${kpi.tone}`} />
              </div>
            ))}
          </section>
          <section className="grid grid-cols-[2fr_1fr] gap-6 px-8">
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-200">Budget vs Actual</div>
              <div className="mt-4 flex h-48 items-end gap-6">
                {[120, 140, 160, 130, 170].map((_, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="h-40 w-5 rounded-md bg-slate-700" />
                    <div className="h-32 w-5 rounded-md bg-sky-400" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-200">Tasks Due Soon</div>
              <div className="mt-4 space-y-3">
                {['Foundation pour', 'Framing begins', 'Roofing delivery', 'Window install'].map((t) => (
                  <div key={t} className="rounded-lg bg-surface px-3 py-2 text-sm">
                    <div className="font-medium text-slate-100">{t}</div>
                    <div className="text-xs text-slate-400">Due Feb 14</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="px-8 py-6">
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-200">Recent Expenses</div>
              <div className="mt-4 divide-y divide-slate-800 text-sm">
                {[
                  ['Concrete Supply Co.', 'Slab / Formwork', 'Maple St', '-$12,480'],
                  ['Riverstone Lumber', 'Framing', 'Maple St', '-$8,220'],
                  ['Peak Electrical', 'Rough-in', 'Maple St', '-$6,540'],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-[2fr_2fr_1fr_1fr] py-3 text-slate-300">
                    <div className="font-medium text-slate-100">{row[0]}</div>
                    <div className="text-slate-400">{row[1]}</div>
                    <div className="text-slate-400">{row[2]}</div>
                    <div className="text-amber-400">{row[3]}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

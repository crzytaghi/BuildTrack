import type { ReactNode } from 'react';

type Kpi = { label: string; value: string; tone: string };

type Props = {
  userName: string;
  kpis: Kpi[];
  onLogout: () => void;
  headerActions?: ReactNode;
};

const DashboardView = ({ userName, kpis, onLogout, headerActions }: Props) => (
  <>
    <header className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
      <div>
        <div className="text-2xl font-semibold font-display">Dashboard</div>
        <div className="text-sm text-slate-400">Welcome back, {userName}.</div>
      </div>
      <div className="flex items-center gap-3">
        {headerActions}
        <button
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
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
  </>
);

export default DashboardView;

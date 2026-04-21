import { useEffect, useMemo, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, VendorItem } from '../types/projects';

const API_BASE = getApiBase();
const fmtFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Dimension = 'project' | 'vendor' | 'category';
type DatePreset = 'this_year' | 'last_year' | 'last_30' | 'last_90' | 'last_6_months' | 'all_time' | 'custom';
type SortKey = 'date' | 'project' | 'vendor' | 'category' | 'lineItem' | 'description' | 'amount';
type SortDir = 'asc' | 'desc';
type Props = { token: string };

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_year',      label: 'This Year' },
  { value: 'last_year',      label: 'Last Year' },
  { value: 'last_30',        label: 'Last 30 Days' },
  { value: 'last_90',        label: 'Last 90 Days' },
  { value: 'last_6_months',  label: 'Last 6 Months' },
  { value: 'all_time',       label: 'All Time' },
  { value: 'custom',         label: 'Custom Range' },
];

const getPresetDates = (preset: DatePreset): { start: string; end: string } => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const year = today.getFullYear();
  const pad = (n: number) => String(n).padStart(2, '0');
  const d2s = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  switch (preset) {
    case 'this_year':     return { start: `${year}-01-01`, end: todayStr };
    case 'last_year':     return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
    case 'last_30':       { const d = new Date(today); d.setDate(d.getDate() - 30);  return { start: d2s(d), end: todayStr }; }
    case 'last_90':       { const d = new Date(today); d.setDate(d.getDate() - 90);  return { start: d2s(d), end: todayStr }; }
    case 'last_6_months': { const d = new Date(today); d.setMonth(d.getMonth() - 6); return { start: d2s(d), end: todayStr }; }
    case 'all_time':      return { start: '', end: '' };
    default:              return { start: `${year}-01-01`, end: todayStr };
  }
};

const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

interface ReportRow {
  expenseId:    string;
  date:         string;
  projectName:  string;
  vendorName:   string;
  categoryName: string;
  lineItem:     string;
  description:  string;
  amount:       number;
}

interface GeneratedReport {
  dimension:     Dimension;
  selectedLabel: string;
  dateLabel:     string;
  startDate:     string;
  endDate:       string;
  rows:          ReportRow[];
}

const selectCls = 'w-full rounded-xl bg-surface px-3 py-2.5 text-sm text-slate-100 outline-none ring-1 ring-slate-800 disabled:opacity-50 disabled:cursor-not-allowed';

const ReportsView = ({ token }: Props) => {
  const [projects,   setProjects]   = useState<ProjectItem[]>([]);
  const [expenses,   setExpenses]   = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors,    setVendors]    = useState<VendorItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Wizard selections
  const [dimension,   setDimension]   = useState<Dimension | ''>('');
  const [selectedId,  setSelectedId]  = useState('');
  const [datePreset,  setDatePreset]  = useState<DatePreset | ''>('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');

  // Report state
  const [report,     setReport]     = useState<GeneratedReport | null>(null);
  const [optsDirty,  setOptsDirty]  = useState(false);
  const [generating, setGenerating] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    (async () => {
      setLoading(true);
      try {
        const [pRes, eRes, cRes, vRes] = await Promise.all([
          fetch(`${API_BASE}/projects`,   { headers }),
          fetch(`${API_BASE}/expenses`,   { headers }),
          fetch(`${API_BASE}/categories`, { headers }),
          fetch(`${API_BASE}/vendors`,    { headers }),
        ]);
        const [pd, ed, cd, vd] = await Promise.all([
          pRes.json() as Promise<{ data: ProjectItem[] }>,
          eRes.json() as Promise<{ data: ExpenseItem[] }>,
          cRes.json() as Promise<{ data: Category[] }>,
          vRes.json() as Promise<{ data: VendorItem[] }>,
        ]);
        setProjects(pd.data);
        setExpenses(ed.data);
        setCategories(cd.data);
        setVendors(vd.data);
      } catch {
        setError('Unable to load report data');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Mark report stale when wizard options change after a report has been generated
  useEffect(() => {
    if (report) setOptsDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, selectedId, datePreset, customStart, customEnd]);

  const handleDimensionChange = (d: Dimension | '') => {
    setDimension(d);
    setSelectedId('');
  };

  const dimensionItems = useMemo(() => {
    if (dimension === 'project')  return projects.map(p  => ({ id: p.id,  name: p.name }));
    if (dimension === 'vendor')   return vendors.map(v   => ({ id: v.id,  name: v.name }));
    if (dimension === 'category') return categories.map(c => ({ id: c.id, name: c.name }));
    return [];
  }, [dimension, projects, vendors, categories]);

  const dimensionLabel =
    dimension === 'project'  ? 'Project'  :
    dimension === 'vendor'   ? 'Vendor'   :
    dimension === 'category' ? 'Category' : 'Item';

  const canGenerate =
    dimension !== '' &&
    selectedId !== '' &&
    datePreset !== '' &&
    (datePreset !== 'custom' || (customStart !== '' && customEnd !== ''));

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);

    const { start, end } =
      datePreset === 'custom'
        ? { start: customStart, end: customEnd }
        : getPresetDates(datePreset as DatePreset);

    const filtered = expenses.filter(e => {
      if (start && e.expenseDate < start) return false;
      if (end   && e.expenseDate > end)   return false;
      if (dimension === 'project'  && e.projectId  !== selectedId) return false;
      if (dimension === 'vendor'   && e.vendorId   !== selectedId) return false;
      if (dimension === 'category' && e.categoryId !== selectedId) return false;
      return true;
    });

    // Fetch budget line items when reporting by project
    const lineItemMap: Record<string, string> = {};
    if (dimension === 'project') {
      try {
        const res = await fetch(`${API_BASE}/projects/${selectedId}/budget-line-items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as { data: BudgetLineItem[] };
          for (const li of data.data) lineItemMap[li.id] = li.description;
        }
      } catch { /* non-blocking */ }
    }

    const lookupLabel = () => {
      if (dimension === 'project')  return projects.find(p => p.id === selectedId)?.name ?? selectedId;
      if (dimension === 'vendor')   return vendors.find(v => v.id === selectedId)?.name ?? selectedId;
      return categories.find(c => c.id === selectedId)?.name ?? selectedId;
    };

    const rows: ReportRow[] = filtered.map(e => ({
      expenseId:    e.id,
      date:         e.expenseDate,
      projectName:  projects.find(p => p.id === e.projectId)?.name    ?? e.projectId,
      vendorName:   vendors.find(v => v.id === e.vendorId)?.name      ?? e.vendorId,
      categoryName: categories.find(c => c.id === e.categoryId)?.name ?? e.categoryId,
      lineItem:     e.lineItemId ? (lineItemMap[e.lineItemId] ?? '—') : '—',
      description:  e.description,
      amount:       e.amount,
    }));

    setReport({
      dimension:     dimension as Dimension,
      selectedLabel: lookupLabel(),
      dateLabel:     DATE_PRESETS.find(p => p.value === datePreset)?.label ?? '',
      startDate:     start,
      endDate:       end,
      rows,
    });
    setOptsDirty(false);
    setSortKey('date');
    setSortDir('asc');
    setGenerating(false);
  };

  const sortedRows = useMemo(() => {
    if (!report) return [];
    const getVal = (row: ReportRow): string | number => {
      switch (sortKey) {
        case 'date':        return row.date;
        case 'project':     return row.projectName;
        case 'vendor':      return row.vendorName;
        case 'category':    return row.categoryName;
        case 'lineItem':    return row.lineItem;
        case 'description': return row.description;
        case 'amount':      return row.amount;
        default:            return row.date;
      }
    };
    return [...report.rows].sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [report, sortKey, sortDir]);

  const totalSpend = useMemo(
    () => sortedRows.reduce((s, r) => s + r.amount, 0),
    [sortedRows],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (col: SortKey) =>
    sortKey === col
      ? <span className="ml-0.5 opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-0.5 opacity-20">↕</span>;

  const handleExportCsv = () => {
    if (!report) return;
    const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const dateRange = report.startDate ? `${report.startDate}-to-${report.endDate}` : 'all-time';
    const filename  = `report-${report.dimension}-${slug(report.selectedLabel)}-${dateRange}.csv`;
    if (report.dimension === 'project') {
      downloadCsv(filename,
        ['Date', 'Vendor', 'Category', 'Line Item', 'Description', 'Amount'],
        sortedRows.map(r => [r.date, r.vendorName, r.categoryName, r.lineItem, r.description, r.amount.toFixed(2)]));
    } else if (report.dimension === 'vendor') {
      downloadCsv(filename,
        ['Date', 'Project', 'Category', 'Description', 'Amount'],
        sortedRows.map(r => [r.date, r.projectName, r.categoryName, r.description, r.amount.toFixed(2)]));
    } else {
      downloadCsv(filename,
        ['Date', 'Project', 'Vendor', 'Description', 'Amount'],
        sortedRows.map(r => [r.date, r.projectName, r.vendorName, r.description, r.amount.toFixed(2)]));
    }
  };

  if (loading) return <div className="px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8">Loading reports...</div>;
  if (error)   return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
    </div>
  );

  return (
    <>
      {/* Print-only header */}
      {report && (
        <div className="hidden print:block px-8 py-6 border-b border-slate-200">
          <div className="text-xl font-semibold text-slate-900">{report.selectedLabel}</div>
          <div className="text-sm text-slate-500">
            {report.dateLabel}{report.startDate ? ` · ${report.startDate} to ${report.endDate}` : ''}
          </div>
        </div>
      )}

      {/* Screen header */}
      <header className="print:hidden flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Reports</div>
          <div className="text-sm text-slate-400">Build a custom report to analyze your project spend.</div>
        </div>
        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Print / PDF
            </button>
          </div>
        )}
      </header>

      {/* Wizard builder */}
      <div className="print:hidden px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel shadow-lg p-5 space-y-5">
          <div className="text-sm font-semibold text-slate-200">Build Your Report</div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Step 1: Dimension */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Report By</label>
              <select
                value={dimension}
                onChange={e => handleDimensionChange(e.target.value as Dimension | '')}
                className={selectCls}
              >
                <option value="">Select dimension...</option>
                <option value="project">Project</option>
                <option value="vendor">Vendor</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Step 2: Item (revealed after dimension chosen) */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${dimension ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="text-xs font-medium text-slate-400">Select {dimensionLabel}</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={!dimension}
                className={selectCls}
              >
                <option value="">Select {dimensionLabel.toLowerCase()}...</option>
                {dimensionItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Date range (revealed after item chosen) */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${selectedId ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="text-xs font-medium text-slate-400">Date Range</label>
              <select
                value={datePreset}
                onChange={e => setDatePreset(e.target.value as DatePreset | '')}
                disabled={!selectedId}
                className={selectCls}
              >
                <option value="">Select range...</option>
                {DATE_PRESETS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Generate button */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${canGenerate ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="text-xs font-medium text-slate-400 invisible select-none">Action</label>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-accent/90 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? 'Generating...' : report && optsDirty ? 'Regenerate Report' : 'Generate Report'}
              </button>
            </div>

          </div>

          {/* Custom date inputs (shown below the grid when custom is selected) */}
          {datePreset === 'custom' && selectedId && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-400 w-full sm:w-auto">Custom Range</span>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl bg-surface px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl bg-surface px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800"
              />
            </div>
          )}
        </div>

        {/* Stale report warning */}
        {report && optsDirty && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Report options have changed. Click <strong>Regenerate Report</strong> to update the results.
          </div>
        )}
      </div>

      {/* Report results */}
      {report && (
        <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
            <div className="rounded-2xl bg-panel p-5 shadow-lg print:border print:border-slate-200">
              <div className="text-xs text-slate-400 print:text-slate-500">{dimensionLabel}</div>
              <div className="mt-2 text-base font-semibold text-slate-100 print:text-slate-900 truncate">{report.selectedLabel}</div>
              <div className="text-xs text-slate-500 mt-0.5">{report.dateLabel}</div>
            </div>
            <div className="rounded-2xl bg-panel p-5 shadow-lg print:border print:border-slate-200">
              <div className="text-xs text-slate-400 print:text-slate-500">Total Spend</div>
              <div className="mt-2 text-base font-semibold text-slate-100 print:text-slate-900">{fmtFull.format(totalSpend)}</div>
            </div>
            <div className="rounded-2xl bg-panel p-5 shadow-lg print:border print:border-slate-200">
              <div className="text-xs text-slate-400 print:text-slate-500">Expenses</div>
              <div className="mt-2 text-base font-semibold text-slate-100 print:text-slate-900">{sortedRows.length}</div>
            </div>
          </div>

          {/* Expense table */}
          <div className="rounded-2xl bg-panel shadow-lg overflow-hidden print:border print:border-slate-200">
            {sortedRows.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">
                No expenses found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${report.dimension === 'project' ? 'min-w-[680px]' : 'min-w-[500px]'}`}>
                  <thead>
                    <tr className="border-b border-slate-800 print:border-slate-200 text-xs text-slate-500 print:text-slate-600">

                      <th onClick={() => handleSort('date')}
                        className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                        Date {sortIcon('date')}
                      </th>

                      {report.dimension === 'project' && (<>
                        <th onClick={() => handleSort('vendor')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                          Vendor {sortIcon('vendor')}
                        </th>
                        <th onClick={() => handleSort('category')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                          Category {sortIcon('category')}
                        </th>
                        <th onClick={() => handleSort('lineItem')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap max-sm:hidden">
                          Line Item {sortIcon('lineItem')}
                        </th>
                      </>)}

                      {report.dimension === 'vendor' && (<>
                        <th onClick={() => handleSort('project')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                          Project {sortIcon('project')}
                        </th>
                        <th onClick={() => handleSort('category')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                          Category {sortIcon('category')}
                        </th>
                      </>)}

                      {report.dimension === 'category' && (<>
                        <th onClick={() => handleSort('project')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                          Project {sortIcon('project')}
                        </th>
                        <th onClick={() => handleSort('vendor')}
                          className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                          Vendor {sortIcon('vendor')}
                        </th>
                      </>)}

                      <th onClick={() => handleSort('description')}
                        className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-300 transition-colors">
                        Description {sortIcon('description')}
                      </th>
                      <th onClick={() => handleSort('amount')}
                        className="cursor-pointer select-none px-4 py-3 text-right font-medium hover:text-slate-300 transition-colors whitespace-nowrap">
                        Amount {sortIcon('amount')}
                      </th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {sortedRows.map(row => (
                      <tr key={row.expenseId} className="hover:bg-slate-800/30 print:hover:bg-transparent transition-colors">
                        <td className="px-4 py-3 text-slate-400 print:text-slate-600 whitespace-nowrap">{row.date}</td>

                        {report.dimension === 'project' && (<>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{row.vendorName}</td>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{row.categoryName}</td>
                          <td className="px-4 py-3 text-slate-400 print:text-slate-600 max-sm:hidden">{row.lineItem}</td>
                        </>)}

                        {report.dimension === 'vendor' && (<>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{row.projectName}</td>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{row.categoryName}</td>
                        </>)}

                        {report.dimension === 'category' && (<>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{row.projectName}</td>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{row.vendorName}</td>
                        </>)}

                        <td className="px-4 py-3 text-slate-300 print:text-slate-700 max-w-[180px] truncate">{row.description}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-100 print:text-slate-900 whitespace-nowrap">{fmtFull.format(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700 print:border-slate-300 text-xs">
                      <td className="px-4 py-3 font-semibold text-slate-400 print:text-slate-600">
                        {sortedRows.length} expense{sortedRows.length !== 1 ? 's' : ''}
                      </td>
                      {report.dimension === 'project' && (<><td /><td /><td className="max-sm:hidden" /></>)}
                      {report.dimension === 'vendor'   && (<><td /><td /></>)}
                      {report.dimension === 'category' && (<><td /><td /></>)}
                      <td />
                      <td className="px-4 py-3 text-right font-semibold text-slate-100 print:text-slate-900 whitespace-nowrap">
                        {fmtFull.format(totalSpend)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </>
  );
};

export default ReportsView;

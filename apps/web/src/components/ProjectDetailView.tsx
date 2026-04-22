import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { useDocumentManager } from '../hooks/useDocumentManager';
import OverviewTab  from './project-detail/OverviewTab';
import BudgetTab    from './project-detail/BudgetTab';
import TasksTab     from './project-detail/TasksTab';
import ExpensesTab  from './project-detail/ExpensesTab';
import SettingsTab  from './project-detail/SettingsTab';
import DocumentsTab from './project-detail/DocumentsTab';

const projectStatusBadge: Record<string, string> = {
  planning:  'bg-slate-700 text-slate-300',
  active:    'bg-sky-900 text-sky-300',
  on_hold:   'bg-amber-900/50 text-amber-300',
  completed: 'bg-emerald-900/50 text-emerald-300',
};
const projectStatusLabel: Record<string, string> = {
  planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed',
};

type TabType = 'overview' | 'budget' | 'tasks' | 'expenses' | 'documents' | 'settings';
const TABS: TabType[] = ['overview', 'budget', 'tasks', 'expenses', 'documents', 'settings'];

type Props = {
  projectId:              string;
  token:                  string;
  deletingProjectId:      string | null;
  onRequestDeleteProject: (id: string | null) => void;
  onDeleteProject:        (id: string) => void;
};

const ProjectDetailView = ({ projectId, token, deletingProjectId, onRequestDeleteProject, onDeleteProject }: Props) => {
  const [activeTab,    setActiveTab]    = useState<TabType>('overview');
  const [tabMenuOpen,  setTabMenuOpen]  = useState(false);

  const {
    project, setProject,
    tasks,   setTasks,
    expenses, setExpenses,
    lineItems, setLineItems,
    quotes,   setQuotes,
    vendors, categories,
    loading, error,
  } = useProjectDetail(projectId, token);

  const docManager = useDocumentManager(projectId, token, activeTab);

  if (loading) {
    return <div className="px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8">Loading project...</div>;
  }
  if (error || !project) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error ?? 'Project not found'}
        </div>
      </div>
    );
  }

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const variance   = (project.budgetTotal ?? 0) - totalSpend;

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <Link to="/projects" className="text-xs uppercase tracking-wide text-slate-300 hover:text-white">
            ← Back to Projects
          </Link>
          <div className="text-2xl font-semibold font-display">{project.name}</div>
          <div className="mt-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusBadge[project.status] ?? 'bg-slate-700 text-slate-300'}`}>
              {projectStatusLabel[project.status] ?? project.status}
            </span>
          </div>
        </div>
        <button
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:text-white"
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </header>

      {/* Tab bar — desktop */}
      <div className="hidden border-b border-slate-800 px-4 sm:flex sm:px-6 lg:px-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab bar — mobile dropdown */}
      <div className="relative border-b border-slate-800 sm:hidden">
        <button
          onClick={() => setTabMenuOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200"
        >
          <span className="capitalize">{activeTab}</span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${tabMenuOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {tabMenuOpen && (
          <div className="absolute left-0 right-0 top-full z-20 border-b border-slate-800 bg-slate-900 shadow-xl">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setTabMenuOpen(false); }}
                className={`flex w-full items-center justify-between px-4 py-3 text-sm capitalize transition-colors ${
                  activeTab === tab ? 'bg-slate-800 text-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          project={project}
          tasks={tasks}
          expenses={expenses}
          vendors={vendors}
          totalSpend={totalSpend}
          variance={variance}
          onNavigateToTab={setActiveTab}
        />
      )}
      {activeTab === 'budget' && (
        <BudgetTab
          project={project}
          lineItems={lineItems}
          setLineItems={setLineItems}
          quotes={quotes}
          setQuotes={setQuotes}
          expenses={expenses}
          vendors={vendors}
          categories={categories}
          token={token}
          projectId={projectId}
        />
      )}
      {activeTab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          setTasks={setTasks}
          projectId={projectId}
          token={token}
        />
      )}
      {activeTab === 'expenses' && (
        <ExpensesTab
          expenses={expenses}
          setExpenses={setExpenses}
          lineItems={lineItems}
          vendors={vendors}
          categories={categories}
          projectId={projectId}
          token={token}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsTab
          project={project}
          onProjectUpdate={setProject}
          deletingProjectId={deletingProjectId}
          onRequestDeleteProject={onRequestDeleteProject}
          onDeleteProject={onDeleteProject}
          token={token}
        />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab {...docManager} />
      )}
    </>
  );
};

export default ProjectDetailView;

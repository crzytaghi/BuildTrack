import type { ProjectItem, ProjectFormState, ProjectStatus } from "../types/projects";

type Props = {
  projects: ProjectItem[];
  loading: boolean;
  error: string | null;
  form: ProjectFormState;
  onFormChange: (next: ProjectFormState) => void;
  onSubmit: () => void;
  onViewProject: (projectId: string) => void;
};

const ProjectsView = ({
  projects,
  loading,
  error,
  form,
  onFormChange,
  onSubmit,
  onViewProject,
}: Props) => (
  <>
    <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div>
        <div className="text-2xl font-semibold font-display">Projects</div>
        <div className="text-sm text-slate-400">Create and manage your projects.</div>
      </div>
    </header>
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-panel p-6 shadow-lg">
        <div className="text-sm font-semibold text-slate-200">New Project</div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Project Name</label>
            <input
              value={form.name}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
              placeholder="Maple St Residence"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={form.status}
              onChange={(event) =>
                onFormChange({ ...form, status: event.target.value as ProjectStatus })
              }
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => onFormChange({ ...form, startDate: event.target.value })}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => onFormChange({ ...form, endDate: event.target.value })}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Budget Total</label>
            <input
              type="number"
              value={form.budgetTotal}
              onChange={(event) => onFormChange({ ...form, budgetTotal: event.target.value })}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Notes</label>
            <input
              value={form.notes}
              onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
        </div>
        <button
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
          onClick={onSubmit}
        >
          Create Project
        </button>
      </div>
    </section>
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-panel p-6 shadow-lg">
        <div className="text-sm font-semibold text-slate-200">Project List</div>
        {loading ? (
          <div className="mt-4 text-sm text-slate-400">Loading projects...</div>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            {projects.length === 0 ? (
              <div className="text-slate-400">No projects yet.</div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-slate-800/70"
                  onClick={() => onViewProject(project.id)}
                >
                  <div>
                    <div className="font-medium text-slate-100">{project.name}</div>
                    <div className="text-xs text-slate-400">
                      {project.status} • {project.startDate || 'No start'} → {project.endDate || 'No end'}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-200">View</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  </>
);

export default ProjectsView;

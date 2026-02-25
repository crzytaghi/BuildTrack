import type { ProjectItem, TaskItem } from '../types/projects';

const statusOptions: TaskItem['status'][] = ['todo', 'in_progress', 'blocked', 'done'];
const statusLabel: Record<TaskItem['status'], string> = {
  todo: 'To-Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

type Props = {
  projects: ProjectItem[];
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  filters: {
    projectId: string;
    status: string;
    fromDate: string;
    toDate: string;
  };
  createOpen: boolean;
  submitAttempted: boolean;
  form: {
    title: string;
    projectId: string;
    status: TaskItem['status'] | '';
    dueDate: string;
  };
  editingTaskId: string | null;
  onFilterChange: (next: Props['filters']) => void;
  onFormChange: (next: Props['form']) => void;
  onCreateTask: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onEditTask: (task: TaskItem) => void;
  onLogout: () => void;
};

const TasksView = ({
  projects,
  tasks,
  loading,
  error,
  filters,
  createOpen,
  submitAttempted,
  form,
  editingTaskId,
  onFilterChange,
  onFormChange,
  onCreateTask,
  onSubmit,
  onCancelEdit,
  onEditTask,
  onLogout,
}: Props) => (
  <>
    <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div>
        <div className="text-2xl font-semibold font-display">Tasks</div>
        <div className="text-sm text-slate-400">Track and update your schedule.</div>
      </div>
      <button
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
        onClick={onLogout}
      >
        Log out
      </button>
    </header>

    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-panel p-6 shadow-lg">
        <div className="text-sm font-semibold text-slate-200">Filters</div>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filters.projectId}
            onChange={(event) =>
              onFilterChange({ ...filters, projectId: event.target.value })
            }
            className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value })}
            className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
          >
            <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => onFilterChange({ ...filters, fromDate: event.target.value })}
            className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => onFilterChange({ ...filters, toDate: event.target.value })}
            className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
          />
        </div>
      </div>
    </section>

    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="flex h-[calc(100vh-380px)] min-h-[320px] flex-col rounded-2xl bg-panel p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Task List</div>
            <div className="text-xs text-slate-500">View and manage all tasks.</div>
          </div>
          {!createOpen && (
            <button
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={onCreateTask}
            >
              Create Task
            </button>
          )}
        </div>
        {createOpen && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
            {(() => {
              const missingTitle = submitAttempted && !form.title.trim();
              const missingProject = submitAttempted && !form.projectId;
              const missingStatus = submitAttempted && !form.status;
              const missingDueDate = submitAttempted && !form.dueDate;
              const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';
              return (
                <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">
                {editingTaskId ? 'Edit Task' : 'New Task'}
              </div>
              <button
                className="text-xs uppercase tracking-wide text-slate-400"
                onClick={onCancelEdit}
              >
                Cancel
              </button>
            </div>
            {error && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <input
                value={form.title}
                onChange={(event) => onFormChange({ ...form, title: event.target.value })}
                placeholder="Task title"
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${
                  missingTitle ? errorClass : ''
                }`}
              />
              <select
                value={form.projectId}
                onChange={(event) => onFormChange({ ...form, projectId: event.target.value })}
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${
                  missingProject ? errorClass : ''
                }`}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(event) =>
                  onFormChange({ ...form, status: event.target.value as TaskItem['status'] | '' })
                }
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${
                  missingStatus ? errorClass : ''
                }`}
              >
                <option value="">Select a Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => onFormChange({ ...form, dueDate: event.target.value })}
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${
                  missingDueDate ? errorClass : ''
                }`}
              />
            </div>
            <button
              className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
              onClick={onSubmit}
            >
              {editingTaskId ? 'Update Task' : 'Create Task'}
            </button>
                </>
              );
            })()}
          </div>
        )}
        <div className="mt-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-slate-400">Loading tasks...</div>
          ) : (
            <div className="divide-y divide-slate-800 text-sm">
              {tasks.length === 0 ? (
                <div className="text-slate-400">No tasks found.</div>
              ) : (
                tasks.map((task) => {
                  const projectName = projects.find((p) => p.id === task.projectId)?.name ?? 'Unknown Project';
                  return (
                  <div key={task.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-slate-100">{task.title}</div>
                      <div className="text-xs text-slate-400">
                        {projectName} • {statusLabel[task.status]} • {task.dueDate || 'No due date'}
                      </div>
                    </div>
                    <button
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                      onClick={() => onEditTask(task)}
                    >
                      Edit
                    </button>
                  </div>
                )})
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  </>
);

export default TasksView;

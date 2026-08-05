import { useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import AuthCard from './components/AuthCard';
import AuthLogin from './components/AuthLogin';
import AuthSignup from './components/AuthSignup';
import CategoryModal from './components/CategoryModal';
import DashboardView from './components/DashboardView';
import DocumentsView from './components/DocumentsView';
import InvoicesView from './components/InvoicesView';
import ExpensesView from './components/ExpensesView';
import MobileNav from './components/MobileNav';
import ProjectDetailView from './components/ProjectDetailView';
import ProjectsView from './components/ProjectsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import Sidebar from './components/Sidebar';
import TasksView from './components/TasksView';
import VendorsView from './components/VendorsView';
import { useAuth } from './hooks/useAuth';
import { useCategories } from './hooks/useCategories';
import { useExpenses } from './hooks/useExpenses';
import { useProjects } from './hooks/useProjects';
import { useTasks } from './hooks/useTasks';
import { useVendors } from './hooks/useVendors';
import {
  computeKpis,
  computeTasksDueSoon,
  computeRecentExpenses,
  computeProjectSpendData,
  computeSpendByMonth,
  computeSpendByCategory,
} from './lib/dashboardUtils';

const AppShell = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const projects = useProjects(auth.token, auth.user);
  const tasks = useTasks(auth.token, auth.user);
  const expenses = useExpenses(auth.token, auth.user);
  const categories = useCategories(auth.token, auth.user);
  const vendors = useVendors(auth.token, auth.user);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // — Auth loading —
  if (auth.authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-slate-200">
        Loading...
      </div>
    );
  }

  // — Auth screens —
  if (!auth.user) {
    return (
      <div className="min-h-screen bg-ink text-slate-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
        <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6">
          <AuthCard
            title="BuildTrack"
            subtitle="Sign in to manage projects, budgets, and expenses."
            authView={auth.authView}
            setAuthView={auth.setAuthView}
            clearError={() => auth.setError(null)}
            clearLoginFields={() => { auth.setLoginEmail(''); auth.setLoginPassword(''); }}
            clearSignupFields={() => {
              auth.setSignupName('');
              auth.setSignupEmail('');
              auth.setSignupPassword('');
              auth.setSignupConfirmPassword('');
              auth.setSignupCompanyName('');
              auth.setSignupAddress('');
              auth.setSignupPhone('');
            }}
            error={auth.error}
          >
            {auth.authView === 'login' ? (
              <AuthLogin
                email={auth.loginEmail}
                password={auth.loginPassword}
                onEmailChange={auth.setLoginEmail}
                onPasswordChange={auth.setLoginPassword}
                onSubmit={async () => {
                  try {
                    await auth.handleAuth('login', { email: auth.loginEmail, password: auth.loginPassword });
                    auth.setLoginEmail('');
                    auth.setLoginPassword('');
                  } catch (err) {
                    auth.setError(err instanceof Error ? err.message : 'Login failed');
                  }
                }}
              />
            ) : (
              <AuthSignup
                name={auth.signupName}
                email={auth.signupEmail}
                password={auth.signupPassword}
                confirmPassword={auth.signupConfirmPassword}
                companyName={auth.signupCompanyName}
                address={auth.signupAddress}
                phone={auth.signupPhone}
                onNameChange={auth.setSignupName}
                onEmailChange={auth.setSignupEmail}
                onPasswordChange={auth.setSignupPassword}
                onConfirmPasswordChange={auth.setSignupConfirmPassword}
                onCompanyNameChange={auth.setSignupCompanyName}
                onAddressChange={auth.setSignupAddress}
                onPhoneChange={auth.setSignupPhone}
                onSubmit={async () => {
                  try {
                    await auth.handleAuth('signup', {
                      name: auth.signupName,
                      email: auth.signupEmail,
                      password: auth.signupPassword,
                      companyName: auth.signupCompanyName,
                      address: auth.signupAddress,
                      phone: auth.signupPhone,
                    });
                    auth.setSignupName('');
                    auth.setSignupEmail('');
                    auth.setSignupPassword('');
                    auth.setSignupConfirmPassword('');
                    auth.setSignupCompanyName('');
                    auth.setSignupAddress('');
                    auth.setSignupPhone('');
                  } catch (err) {
                    auth.setError(err instanceof Error ? err.message : 'Signup failed');
                  }
                }}
              />
            )}
          </AuthCard>
        </div>
      </div>
    );
  }

  // — Dashboard derived data —
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const kpis = computeKpis(projects.projects, expenses.expenses);
  const tasksDueSoon = computeTasksDueSoon(tasks.tasks, projects.projects, today, sevenDaysOut);
  const recentExpenses = computeRecentExpenses(expenses.expenses, vendors.vendors, projects.projects);
  const projectSpendData = computeProjectSpendData(projects.projects, expenses.expenses);
  const spendByMonth = computeSpendByMonth(expenses.expenses);
  const spendByCategory = computeSpendByCategory(categories.categories, expenses.expenses);

  // — Main layout —
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
      <div className="md:grid md:h-screen md:grid-cols-[260px_1fr]">
        <Sidebar onLogout={auth.handleLogout} />
        <main className="overflow-y-auto md:h-full">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#0b1118] px-4 py-4 md:hidden">
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
              onClick={() => setMobileNavOpen(true)}
            >
              ☰
            </button>
            <div className="text-lg font-semibold font-display">BuildTrack</div>
            <div className="w-[40px]" />
          </div>
          <MobileNav
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            onLogout={auth.handleLogout}
          />
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  userName={auth.user?.name ?? 'Builder'}
                  companyName={auth.companyName ?? 'Company'}
                  kpis={kpis}
                  tasksDueSoon={tasksDueSoon}
                  recentExpenses={recentExpenses}
                  projectSpendData={projectSpendData}
                  spendByMonth={spendByMonth}
                  spendByCategory={spendByCategory}
                  headerActions={
                    <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow">
                      Export CSV
                    </button>
                  }
                />
              }
            />
            <Route
              path="/projects"
              element={
                <ProjectsView
                  projects={projects.projects}
                  loading={projects.projectsLoading}
                  error={projects.projectsError}
                  form={projects.projectForm}
                  onFormChange={projects.setProjectForm}
                  onSubmit={projects.handleProjectSubmit}
                  onViewProject={(id) => navigate(`/projects/${id}`)}
                />
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProjectDetailRoute
                  token={auth.token ?? ''}
                  companyName={auth.companyName ?? 'Company'}
                  deletingProjectId={projects.deletingProjectId}
                  onRequestDeleteProject={projects.setDeletingProjectId}
                  onDeleteProject={projects.handleProjectDelete}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksView
                  projects={projects.projects}
                  tasks={tasks.tasks}
                  loading={tasks.tasksLoading}
                  error={tasks.tasksError}
                  filters={tasks.taskFilters}
                  form={tasks.taskForm}
                  createOpen={tasks.taskCreateOpen || Boolean(tasks.editingTaskId)}
                  submitAttempted={tasks.taskSubmitAttempted}
                  editingTaskId={tasks.editingTaskId}
                  onFilterChange={tasks.handleFilterChange}
                  onFormChange={tasks.setTaskForm}
                  onCreateTask={tasks.onCreateTask}
                  onSubmit={tasks.handleTaskSubmit}
                  onCancelEdit={tasks.closeTaskForm}
                  onEditTask={tasks.selectTaskForEdit}
                  deletingTaskId={tasks.deletingTaskId}
                  onRequestDeleteTask={tasks.setDeletingTaskId}
                  onDeleteTask={tasks.handleTaskDelete}
                />
              }
            />
            <Route
              path="/expenses"
              element={
                <ExpensesView
                  projects={projects.projects}
                  expenses={expenses.expenses}
                  categories={categories.categories}
                  vendors={vendors.vendors}
                  budgetLineItems={expenses.lineItems}
                  loading={expenses.expensesLoading}
                  error={expenses.expensesError}
                  filters={expenses.expenseFilters}
                  form={expenses.expenseForm}
                  createOpen={expenses.expenseCreateOpen || Boolean(expenses.editingExpenseId)}
                  submitAttempted={expenses.expenseSubmitAttempted}
                  editingExpenseId={expenses.editingExpenseId}
                  onFilterChange={expenses.setExpenseFilters}
                  onFormChange={expenses.setExpenseForm}
                  onCreateExpense={expenses.onCreateExpense}
                  onSubmit={expenses.handleExpenseSubmit}
                  onCancelEdit={expenses.closeExpenseForm}
                  onEditExpense={expenses.selectExpenseForEdit}
                  deletingExpenseId={expenses.deletingExpenseId}
                  onRequestDeleteExpense={expenses.setDeletingExpenseId}
                  onDeleteExpense={expenses.handleExpenseDelete}
                  onManageCategories={() => setCategoryModalOpen(true)}
                  receiptFile={expenses.receiptFile}
                  onReceiptFileChange={expenses.setReceiptFile}
                  onViewReceipt={expenses.handleViewReceipt}
                />
              }
            />
            <Route
              path="/vendors"
              element={
                <VendorsView
                  vendors={vendors.vendors}
                  expenses={expenses.expenses}
                  projects={projects.projects}
                  loading={vendors.vendorsLoading}
                  error={vendors.vendorsError}
                  form={vendors.vendorForm}
                  editingVendorId={vendors.editingVendorId}
                  createOpen={vendors.vendorCreateOpen || Boolean(vendors.editingVendorId)}
                  submitAttempted={vendors.vendorSubmitAttempted}
                  onFormChange={vendors.setVendorForm}
                  onCreateVendor={vendors.onCreateVendor}
                  onSubmit={vendors.handleVendorSubmit}
                  onCancelEdit={vendors.closeVendorForm}
                  onEditVendor={vendors.selectVendorForEdit}
                  deletingVendorId={vendors.deletingVendorId}
                  onRequestDeleteVendor={vendors.setDeletingVendorId}
                  onDeleteVendor={vendors.handleVendorDelete}
                />
              }
            />
            <Route
              path="/invoices"
              element={
                <InvoicesView
                  token={auth.token ?? ''}
                  companyName={auth.companyName ?? 'Company'}
                  projects={projects.projects}
                />
              }
            />
            <Route path="/reports" element={<ReportsView token={auth.token ?? ''} />} />
            <Route path="/settings" element={<SettingsView token={auth.token ?? ''} userEmail={auth.user?.email ?? ''} />} />
            <Route path="/documents" element={<DocumentsView token={auth.token ?? ''} projects={projects.projects} />} />
          </Routes>
        </main>
      </div>
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        token={auth.token ?? ''}
        categories={categories.categories}
        onCategoriesChange={categories.setCategories}
      />
    </div>
  );
};

const ProjectDetailRoute = ({
  token,
  companyName,
  deletingProjectId,
  onRequestDeleteProject,
  onDeleteProject,
}: {
  token: string;
  companyName: string;
  deletingProjectId: string | null;
  onRequestDeleteProject: (id: string | null) => void;
  onDeleteProject: (id: string) => void;
}) => {
  const { id } = useParams();
  if (!id) return null;
  return (
    <ProjectDetailView
      projectId={id}
      token={token}
      companyName={companyName}
      deletingProjectId={deletingProjectId}
      onRequestDeleteProject={onRequestDeleteProject}
      onDeleteProject={onDeleteProject}
    />
  );
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;

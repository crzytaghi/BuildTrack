import type { ExpenseItem, VendorFormState, VendorItem } from '../types/projects';

type Props = {
  vendors: VendorItem[];
  expenses: ExpenseItem[];
  loading: boolean;
  error: string | null;
  form: VendorFormState;
  editingVendorId: string | null;
  createOpen: boolean;
  submitAttempted: boolean;
  onFormChange: (next: VendorFormState) => void;
  onCreateVendor: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onEditVendor: (vendor: VendorItem) => void;
};

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const VendorsView = ({
  vendors,
  expenses,
  loading,
  error,
  form,
  editingVendorId,
  createOpen,
  submitAttempted,
  onFormChange,
  onCreateVendor,
  onSubmit,
  onCancelEdit,
  onEditVendor,
}: Props) => {
  const spendByVendor = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.vendorId] = (acc[e.vendorId] ?? 0) + e.amount;
    return acc;
  }, {});

  const countByVendor = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.vendorId] = (acc[e.vendorId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Vendors</div>
          <div className="text-sm text-slate-400">Manage subcontractors and suppliers.</div>
        </div>
      </header>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Vendor List</div>
              <div className="text-xs text-slate-500">View and manage all vendors.</div>
            </div>
            {!createOpen && (
              <button
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                onClick={onCreateVendor}
              >
                Add Vendor
              </button>
            )}
          </div>

          {createOpen && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
              {(() => {
                const missingName = submitAttempted && !form.name.trim();
                const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-200">
                        {editingVendorId ? 'Edit Vendor' : 'New Vendor'}
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
                    <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <input
                        value={form.name}
                        onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                        placeholder="Name *"
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingName ? errorClass : ''}`}
                      />
                      <input
                        value={form.trade}
                        onChange={(e) => onFormChange({ ...form, trade: e.target.value })}
                        placeholder="Trade / Specialty"
                        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                      />
                      <input
                        value={form.contactName}
                        onChange={(e) => onFormChange({ ...form, contactName: e.target.value })}
                        placeholder="Contact Name"
                        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                      />
                      <input
                        value={form.phone}
                        onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
                        placeholder="Phone"
                        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                      />
                      <input
                        value={form.email}
                        onChange={(e) => onFormChange({ ...form, email: e.target.value })}
                        placeholder="Email"
                        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                      />
                      <input
                        value={form.notes}
                        onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
                        placeholder="Notes"
                        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                      />
                    </div>
                    <button
                      className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                      onClick={onSubmit}
                    >
                      {editingVendorId ? 'Update Vendor' : 'Add Vendor'}
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-slate-400">Loading vendors...</div>
            ) : (
              <div className="divide-y divide-slate-800 text-sm">
                {vendors.length === 0 ? (
                  <div className="text-slate-400">No vendors found.</div>
                ) : (
                  vendors.map((vendor) => {
                    const totalSpend = spendByVendor[vendor.id] ?? 0;
                    const expenseCount = countByVendor[vendor.id] ?? 0;
                    return (
                      <div key={vendor.id} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium text-slate-100">{vendor.name}</div>
                          <div className="text-xs text-slate-400">
                            {vendor.trade ?? 'No trade'} • {fmt.format(totalSpend)} • {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
                          </div>
                        </div>
                        <button
                          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                          onClick={() => onEditVendor(vendor)}
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default VendorsView;

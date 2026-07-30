import type { FormEvent } from 'react';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

type Props = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  address: string;
  phone: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onCompanyNameChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSubmit: () => Promise<void>;
};

const field = 'mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent';

const AuthSignup = ({
  name, email, password, confirmPassword, companyName, address, phone,
  onNameChange, onEmailChange, onPasswordChange, onConfirmPasswordChange,
  onCompanyNameChange, onAddressChange, onPhoneChange, onSubmit,
}: Props) => {
  const passwordValid = PASSWORD_RULES.every(r => r.test(password));
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e: FormEvent) => { e.preventDefault(); await onSubmit(); }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Your Name</label>
          <input type="text" required value={name} onChange={e => onNameChange(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
          <input type="email" required value={email} onChange={e => onEmailChange(e.target.value)} className={field} />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-slate-400">Company Name</label>
        <input type="text" required value={companyName} onChange={e => onCompanyNameChange(e.target.value)} placeholder="Acme Builders" className={field} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Company Address</label>
          <input type="text" required value={address} onChange={e => onAddressChange(e.target.value)} placeholder="123 Main St, City, ST 00000" className={field} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Company Phone</label>
          <input type="tel" required value={phone} onChange={e => onPhoneChange(e.target.value)} placeholder="(555) 000-0000" className={field} />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-slate-400">Password</label>
        <input type="password" required minLength={8} value={password} onChange={e => onPasswordChange(e.target.value)} className={field} />
        {password.length > 0 && (
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map(rule => (
              <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span>{rule.test(password) ? '✓' : '○'}</span>
                {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-slate-400">Confirm Password</label>
        <input type="password" required minLength={8} value={confirmPassword} onChange={e => onConfirmPasswordChange(e.target.value)} className={field} />
        {confirmPassword.length > 0 && (
          <p className={`mt-1.5 text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
            {passwordsMatch ? '✓ Passwords match' : '○ Passwords do not match'}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!passwordValid || !passwordsMatch}
        className="mt-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Create Account
      </button>
    </form>
  );
};

export default AuthSignup;

import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle: string;
  authView: 'login' | 'signup';
  setAuthView: (view: 'login' | 'signup') => void;
  clearLoginFields: () => void;
  clearSignupFields: () => void;
  clearError: () => void;
  error?: string | null;
  children: ReactNode;
};

const AuthCard = ({
  title,
  subtitle,
  authView,
  setAuthView,
  clearLoginFields,
  clearSignupFields,
  clearError,
  error,
  children,
}: Props) => (
  <div className="w-full rounded-2xl bg-panel p-8 shadow-xl">
    <div className="text-2xl font-semibold font-display">{title}</div>
    <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
    <div className="mt-6 flex gap-2 rounded-full bg-slate-900 p-1 text-sm">
      <button
        className={`flex-1 rounded-full px-4 py-2 ${
          authView === 'login' ? 'bg-accent text-slate-950' : 'text-slate-300'
        }`}
        onClick={() => {
          setAuthView('login');
          clearError();
          clearSignupFields();
        }}
      >
        Login
      </button>
      <button
        className={`flex-1 rounded-full px-4 py-2 ${
          authView === 'signup' ? 'bg-accent text-slate-950' : 'text-slate-300'
        }`}
        onClick={() => {
          setAuthView('signup');
          clearError();
          clearLoginFields();
        }}
      >
        Sign Up
      </button>
    </div>

    {error && (
      <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        {error}
      </div>
    )}

    {children}
  </div>
);

export default AuthCard;

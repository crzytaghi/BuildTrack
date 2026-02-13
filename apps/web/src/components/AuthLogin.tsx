import type { FormEvent } from 'react';

type Props = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export default function AuthLogin({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onSubmit();
      }}
    >
      <div>
        <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-slate-400">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
        />
      </div>
      <button
        className="mt-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
        type="submit"
      >
        Login
      </button>
    </form>
  );
}

import { Link } from 'react-router-dom';

/** Shown when a user opens a page their role can't use (e.g. a bookmarked link). */
const NoAccessView = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
    <div className="text-xl font-semibold font-display text-slate-100">You don't have access to this page</div>
    <div className="mt-2 max-w-md text-sm text-slate-400">
      Your role doesn't include this area. Ask your company owner if you need access.
    </div>
    <Link to="/" className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950">
      Back to dashboard
    </Link>
  </div>
);

export default NoAccessView;

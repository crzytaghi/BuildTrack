import { Link, useLocation } from 'react-router-dom';

const nav = ['Dashboard', 'Projects', 'Tasks', 'Expenses', 'Vendors', 'Documents', 'Reports', 'Settings'];

type Props = {
  onLogout: () => void;
};

const Sidebar = ({ onLogout }: Props) => {
  const location = useLocation();
  return (
    <aside className="hidden h-full flex-col border-r border-slate-800 bg-[#0b1118] p-6 md:flex">
      <div>
        <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
        <div className="mt-10 space-y-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item}
              to={item === 'Dashboard' ? '/' : `/${item.toLowerCase()}`}
              className={`block rounded-lg px-3 py-2 ${
                (item === 'Dashboard' && location.pathname === '/') ||
                (item === 'Projects' && location.pathname.startsWith('/projects')) ||
                (item !== 'Dashboard' && item !== 'Projects' && location.pathname === `/${item.toLowerCase()}`)
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400'
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
      <button
        className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
        onClick={onLogout}
      >
        Log out
      </button>
    </aside>
  );
};

export default Sidebar;

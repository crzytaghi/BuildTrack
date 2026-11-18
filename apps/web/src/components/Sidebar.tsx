import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../context/CurrentUserContext';
import { isNavActive, navItemsFor } from '../lib/nav';

type Props = {
  onLogout: () => void;
};

const Sidebar = ({ onLogout }: Props) => {
  const location = useLocation();
  const nav = navItemsFor(useRole());
  return (
    <aside className="hidden h-full flex-col border-r border-slate-800 bg-[#0b1118] p-6 md:flex">
      <div>
        <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
        <div className="mt-10 space-y-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-lg px-3 py-2 ${
                isNavActive(item, location.pathname)
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400'
              }`}
            >
              {item.label}
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

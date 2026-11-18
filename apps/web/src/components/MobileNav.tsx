import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../context/CurrentUserContext';
import { isNavActive, navItemsFor } from '../lib/nav';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const MobileNav = ({ isOpen, onClose, onLogout }: Props) => {
  const location = useLocation();
  const nav = navItemsFor(useRole());
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 flex flex-col bg-[#0b1118] p-6 shadow-2xl">
        <div>
          <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
          <div className="mt-8 space-y-2 text-sm">
            {nav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
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
          onClick={() => { onClose(); onLogout(); }}
        >
          Log out
        </button>
      </aside>
    </div>
  );
};

export default MobileNav;

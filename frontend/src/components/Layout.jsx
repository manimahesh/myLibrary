import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  const isActive = (path, search) => {
    if (search) {
      return location.pathname === path && location.search.includes(search);
    }
    if (path === '/store') {
      return location.pathname === '/store' && !location.search.includes('focus=search');
    }
    return location.pathname === path;
  };

  const navLinks = [
    { label: 'Store', to: '/store', icon: <IconStore />, active: isActive('/store') },
    { label: 'Search', to: '/store?focus=search', icon: <IconSearch />, active: isActive('/store', 'focus=search') },
    { label: 'Wishlist', to: '/wishlist', icon: <IconHeart />, active: isActive('/wishlist') },
    { label: 'Profile', to: '/profile', icon: <IconUser />, active: isActive('/profile') && !location.search.includes('tab=payments') },
    { label: 'Payment Methods', to: '/profile?tab=payments', icon: <IconCard />, active: isActive('/profile', 'tab=payments') },
  ];

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <div className="navbar-brand-logo"><IconBook /></div>
          <span className="navbar-brand-name">MyLibrary</span>
        </div>

        <nav className="app-sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`app-sidebar-link${link.active ? ' active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          {user && <span className="app-sidebar-email">{user.email}</span>}
          <div className="app-sidebar-user-row">
            <div className="navbar-avatar">{initial}</div>
            <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login'); }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

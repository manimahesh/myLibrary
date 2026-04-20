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


function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initial = (() => {
    if (user?.first_name && user?.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    if (user?.first_name) return user.first_name[0].toUpperCase();
    const email = user?.email;
    if (!email) return '?';
    const local = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    const parts = email.split('@')[0].split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (local.length >= 2) return (local[0] + local[1]).toUpperCase();
    if (local.length === 1) return local[0].toUpperCase();
    return '?';
  })();
  const params = new URLSearchParams(location.search);
  const isSearchFocus = location.pathname === '/store' && params.get('focus') === 'search';

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { label: 'Store', to: '/store', icon: <IconStore />, active: isActive('/store') && !isSearchFocus },
    { label: 'Search', to: '/store?focus=search', icon: <IconSearch />, active: isSearchFocus },
    { label: 'Wishlist', to: '/wishlist', icon: <IconHeart />, active: isActive('/wishlist') },
    { label: "Books I've Read", to: '/read-books', icon: <IconCheck />, active: isActive('/read-books') },
    { label: 'Profile', to: '/profile', icon: <IconUser />, active: isActive('/profile') },
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
          <div className="app-sidebar-user-row">
            <div className="navbar-avatar">{initial}</div>
            <div className="app-sidebar-user-info">
              {user && <span className="app-sidebar-email">{user.email}</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm app-sidebar-signout" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

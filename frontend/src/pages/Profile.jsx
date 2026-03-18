import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AddressList from '../components/AddressList';
import PaymentMethodList from '../components/PaymentMethodList';

function IconMap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('addresses');

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-logo">
            <IconBook />
          </div>
          <span className="navbar-brand-name">MyLibrary</span>
        </div>
        <div className="navbar-user">
          {user && <span className="navbar-email">{user.email}</span>}
          <div className="navbar-avatar">{initial}</div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="sidebar-label">Account</div>
          <div className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <IconMap />
              Addresses
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <IconCard />
              Payment Methods
            </button>
          </div>
        </aside>

        <main className="profile-content">
          {activeTab === 'addresses' && <AddressList />}
          {activeTab === 'payments' && <PaymentMethodList />}
        </main>
      </div>
    </>
  );
}

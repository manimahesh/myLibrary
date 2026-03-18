import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AddressList from '../components/AddressList';
import PaymentMethodList from '../components/PaymentMethodList';

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('addresses');

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>Profile</h2>
        {user && <p>{user.email}</p>}
        <button onClick={logout}>Logout</button>
      </div>

      <nav className="profile-nav">
        <button
          className={activeTab === 'addresses' ? 'active' : ''}
          onClick={() => setActiveTab('addresses')}
        >
          Addresses
        </button>
        <button
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          Payment Methods
        </button>
      </nav>

      <div className="profile-content">
        {activeTab === 'addresses' && <AddressList />}
        {activeTab === 'payments' && <PaymentMethodList />}
      </div>
    </div>
  );
}

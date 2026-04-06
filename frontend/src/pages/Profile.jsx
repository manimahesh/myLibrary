import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddressList from '../components/AddressList';
import PaymentMethodList from '../components/PaymentMethodList';

export default function Profile() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'payments' ? 'payments' : 'addresses';

  return (
    <div className="profile-content-page">
      <div className="profile-header">
        <div className="profile-header-info">
          <div className="navbar-avatar profile-avatar">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>{user?.email}</h2>
            <p style={{ color: 'var(--color-text-3)', fontSize: 13, margin: '2px 0 0' }}>Account settings</p>
          </div>
        </div>
      </div>

      {activeTab === 'addresses' && <AddressList />}
      {activeTab === 'payments' && <PaymentMethodList />}
    </div>
  );
}

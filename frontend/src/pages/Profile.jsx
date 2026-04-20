import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import AddressList from '../components/AddressList';
import PaymentMethodList from '../components/PaymentMethodList';
import api from '../services/api';

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconPin() {
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

function ProfileInfoTab() {
  const { user, updateUser } = useAuth();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  });

  async function onSubmit(data) {
    setServerError('');
    setSuccess(false);
    try {
      const res = await api.put('/auth/me', data);
      updateUser(res.data.user);
      setSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to update profile.');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Profile Information</h2>
          <p className="section-desc">Update your name and personal details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 480 }}>
        {serverError && <div className="server-error">{serverError}</div>}
        {success && (
          <div className="profile-success-banner">Profile updated successfully.</div>
        )}

        <div className="form-row">
          <div className={`form-group ${errors.first_name ? 'has-error' : ''}`}>
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              type="text"
              placeholder="Jane"
              {...register('first_name', { maxLength: { value: 100, message: 'Max 100 characters' } })}
            />
            {errors.first_name && <span className="field-error">{errors.first_name.message}</span>}
          </div>

          <div className={`form-group ${errors.last_name ? 'has-error' : ''}`}>
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              type="text"
              placeholder="Smith"
              {...register('last_name', { maxLength: { value: 100, message: 'Max 100 characters' } })}
            />
            {errors.last_name && <span className="field-error">{errors.last_name.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Email address</label>
          <input type="email" value={user?.email || ''} disabled className="profile-input-readonly" readOnly />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

function ChangePasswordTab() {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch('new_password');

  async function onSubmit(data) {
    setServerError('');
    setSuccess(false);
    try {
      await api.put('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to change password.');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Change Password</h2>
          <p className="section-desc">Choose a strong password you haven&apos;t used before</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 480 }}>
        {serverError && <div className="server-error">{serverError}</div>}
        {success && (
          <div className="profile-success-banner">Password changed successfully.</div>
        )}

        <div className={`form-group ${errors.current_password ? 'has-error' : ''}`}>
          <label htmlFor="current_password">Current password</label>
          <input
            id="current_password"
            type="password"
            placeholder="Enter your current password"
            {...register('current_password', { required: 'Current password is required' })}
          />
          {errors.current_password && <span className="field-error">{errors.current_password.message}</span>}
        </div>

        <div className={`form-group ${errors.new_password ? 'has-error' : ''}`}>
          <label htmlFor="new_password">New password</label>
          <input
            id="new_password"
            type="password"
            placeholder="Min. 8 characters"
            {...register('new_password', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
            })}
          />
          {errors.new_password && <span className="field-error">{errors.new_password.message}</span>}
        </div>

        <div className={`form-group ${errors.confirm_password ? 'has-error' : ''}`}>
          <label htmlFor="confirm_password">Confirm new password</label>
          <input
            id="confirm_password"
            type="password"
            placeholder="Re-enter new password"
            {...register('confirm_password', {
              required: 'Please confirm your new password',
              validate: val => val === newPassword || 'Passwords do not match',
            })}
          />
          {errors.confirm_password && <span className="field-error">{errors.confirm_password.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

const TABS = [
  { id: 'profile', label: 'Profile Info', icon: <IconUser /> },
  { id: 'password', label: 'Change Password', icon: <IconLock /> },
  { id: 'addresses', label: 'Addresses', icon: <IconPin /> },
  { id: 'payments', label: 'Payment Methods', icon: <IconCard /> },
];

export default function Profile() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const initials = (() => {
    if (user?.first_name && user?.last_name) return (user.first_name[0] + user.last_name[0]).toUpperCase();
    if (user?.first_name) return user.first_name[0].toUpperCase();
    const email = user?.email;
    if (!email) return '?';
    const local = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.length >= 2 ? (local[0] + local[1]).toUpperCase() : local[0].toUpperCase();
  })();

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '';

  return (
    <div className="profile-layout">
      <aside className="profile-sidebar">
        <div className="profile-sidebar-user">
          <div className="navbar-avatar profile-sidebar-avatar">{initials}</div>
          <div className="profile-sidebar-user-info">
            {displayName && <div className="profile-sidebar-name">{displayName}</div>}
            {user?.first_name && <div className="profile-sidebar-email">{user.email}</div>}
          </div>
        </div>

        <div className="sidebar-label">Account</div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-nav-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setSearchParams({ tab: tab.id })}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="profile-content">
        {activeTab === 'profile' && <ProfileInfoTab />}
        {activeTab === 'password' && <ChangePasswordTab />}
        {activeTab === 'addresses' && <AddressList />}
        {activeTab === 'payments' && <PaymentMethodList />}
      </div>
    </div>
  );
}

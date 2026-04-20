import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../services/api', () => ({ default: { put: vi.fn() } }));
vi.mock('../../components/AddressList', () => ({ default: () => <div>AddressList</div> }));
vi.mock('../../components/PaymentMethodList', () => ({ default: () => <div>PaymentMethodList</div> }));

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Profile from '../../pages/Profile';

const mockUser = { email: 'a@b.com', first_name: 'Jane', last_name: 'Smith' };

function renderProfile(tab = 'profile') {
  const updateUser = vi.fn();
  useAuth.mockReturnValue({ user: mockUser, updateUser });
  render(
    <MemoryRouter initialEntries={[`/profile${tab !== 'profile' ? `?tab=${tab}` : ''}`]}>
      <Routes>
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );
  return { updateUser };
}

describe('Profile page', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('tab navigation', () => {
    it('shows Profile Info tab by default', () => {
      renderProfile();
      expect(screen.getByRole('heading', { name: /Profile Information/i })).toBeInTheDocument();
    });

    it('shows Change Password tab when ?tab=password', () => {
      renderProfile('password');
      expect(screen.getByRole('heading', { name: /Change Password/i })).toBeInTheDocument();
    });

    it('shows AddressList when ?tab=addresses', () => {
      renderProfile('addresses');
      expect(screen.getByText('AddressList')).toBeInTheDocument();
    });

    it('shows PaymentMethodList when ?tab=payments', () => {
      renderProfile('payments');
      expect(screen.getByText('PaymentMethodList')).toBeInTheDocument();
    });

    it('renders all 4 tab buttons in the sidebar', () => {
      renderProfile();
      expect(screen.getByRole('button', { name: /Profile Info/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Addresses/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Payment Methods/i })).toBeInTheDocument();
    });
  });

  describe('ProfileInfoTab', () => {
    it('renders first name, last name, and read-only email fields', () => {
      renderProfile();
      expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('a@b.com')).toBeDisabled();
    });

    it('pre-fills first and last name from user context', () => {
      renderProfile();
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    });

    it('calls PUT /auth/me and updateUser on success', async () => {
      const { updateUser } = renderProfile();
      api.put.mockResolvedValue({ data: { user: { ...mockUser, first_name: 'Janet' } } });
      fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Janet' } });
      fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
      await waitFor(() => expect(api.put).toHaveBeenCalledWith('/auth/me', expect.objectContaining({ first_name: 'Janet' })));
      expect(updateUser).toHaveBeenCalled();
    });

    it('shows success banner after save', async () => {
      renderProfile();
      api.put.mockResolvedValue({ data: { user: mockUser } });
      fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
      await waitFor(() => expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument());
    });

    it('shows server error when PUT /auth/me fails', async () => {
      renderProfile();
      api.put.mockRejectedValue({ response: { data: { error: 'Server error' } } });
      fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
      await waitFor(() => expect(screen.getByText(/Server error/i)).toBeInTheDocument());
    });
  });

  describe('ChangePasswordTab', () => {
    it('renders current, new, and confirm password fields', () => {
      renderProfile('password');
      expect(screen.getByLabelText('Current password')).toBeInTheDocument();
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
    });

    it('shows success banner after password change', async () => {
      renderProfile('password');
      api.put.mockResolvedValue({});
      fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'oldpass1' } });
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update password/i }));
      await waitFor(() => expect(screen.getByText(/Password changed successfully/i)).toBeInTheDocument());
    });

    it('shows validation error when passwords do not match', async () => {
      renderProfile('password');
      fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'oldpass1' } });
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different' } });
      fireEvent.click(screen.getByRole('button', { name: /Update password/i }));
      await waitFor(() => expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument());
    });

    it('shows server error when change-password fails', async () => {
      renderProfile('password');
      api.put.mockRejectedValue({ response: { data: { error: 'Current password is incorrect' } } });
      fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'wrongpass' } });
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update password/i }));
      await waitFor(() => expect(screen.getByText(/Current password is incorrect/i)).toBeInTheDocument());
    });
  });
});

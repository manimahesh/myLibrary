import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from '../../context/AuthContext';
import Login from '../../pages/Login';

function renderLogin() {
  const login = vi.fn();
  useAuth.mockReturnValue({ login });
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/store" element={<div>Store Page</div>} />
      </Routes>
    </MemoryRouter>
  );
  return { login };
}

describe('Login page', () => {
  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('calls login with entered credentials on submit', async () => {
    const { login } = renderLogin();
    login.mockResolvedValue({ token: 'jwt', user: { email: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.com', 'password123'));
  });

  it('shows an error message on login failure', async () => {
    const { login } = renderLogin();
    login.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument());
  });

  it('navigates to /store after successful login', async () => {
    const { login } = renderLogin();
    login.mockResolvedValue({ token: 'jwt', user: { email: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText('Store Page')).toBeInTheDocument());
  });
});

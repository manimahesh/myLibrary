import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));
import api from '../../services/api';

function Consumer() {
  const { user, isAuthenticated, login, logout, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="email">{user?.email || ''}</span>
      <span data-testid="first-name">{user?.first_name || ''}</span>
      <button onClick={() => login('a@b.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ first_name: 'Jane' })}>Update</button>
    </div>
  );
}

function renderWithProvider() {
  return render(<AuthProvider><Consumer /></AuthProvider>);
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts unauthenticated when no token in localStorage', () => {
    renderWithProvider();
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });

  it('starts authenticated when token is in localStorage', () => {
    localStorage.setItem('token', 'existing-token');
    renderWithProvider();
    expect(screen.getByTestId('auth').textContent).toBe('yes');
  });

  it('login sets token and user', async () => {
    api.post.mockResolvedValue({
      data: { token: 'new-jwt', user: { email: 'a@b.com' } },
    });
    renderWithProvider();
    await act(() => userEvent.click(screen.getByText('Login')));
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('email').textContent).toBe('a@b.com');
    expect(localStorage.getItem('token')).toBe('new-jwt');
  });

  it('logout clears token and user', async () => {
    api.post.mockResolvedValue({ data: { token: 'jwt', user: { email: 'a@b.com' } } });
    renderWithProvider();
    await act(() => userEvent.click(screen.getByText('Login')));
    await act(() => userEvent.click(screen.getByText('Logout')));
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow();
    spy.mockRestore();
  });

  it('re-hydrates user from localStorage on mount', () => {
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('user', JSON.stringify({ email: 'stored@b.com', first_name: 'Stored' }));
    renderWithProvider();
    expect(screen.getByTestId('email').textContent).toBe('stored@b.com');
    expect(screen.getByTestId('first-name').textContent).toBe('Stored');
  });

  it('login persists user object to localStorage', async () => {
    api.post.mockResolvedValue({
      data: { token: 'new-jwt', user: { email: 'a@b.com', first_name: 'Jane' } },
    });
    renderWithProvider();
    await act(() => userEvent.click(screen.getByText('Login')));
    const stored = JSON.parse(localStorage.getItem('user'));
    expect(stored.email).toBe('a@b.com');
    expect(stored.first_name).toBe('Jane');
  });

  it('logout removes user from localStorage', async () => {
    api.post.mockResolvedValue({ data: { token: 'jwt', user: { email: 'a@b.com' } } });
    renderWithProvider();
    await act(() => userEvent.click(screen.getByText('Login')));
    await act(() => userEvent.click(screen.getByText('Logout')));
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('updateUser merges updates into user state and localStorage', async () => {
    api.post.mockResolvedValue({ data: { token: 'jwt', user: { email: 'a@b.com', first_name: '' } } });
    renderWithProvider();
    await act(() => userEvent.click(screen.getByText('Login')));
    await act(() => userEvent.click(screen.getByText('Update')));
    expect(screen.getByTestId('first-name').textContent).toBe('Jane');
    const stored = JSON.parse(localStorage.getItem('user'));
    expect(stored.first_name).toBe('Jane');
  });
});

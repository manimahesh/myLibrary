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
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="email">{user?.email || ''}</span>
      <button onClick={() => login('a@b.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
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
});

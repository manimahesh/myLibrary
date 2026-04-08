import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from '../../components/ProtectedRoute';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from '../../context/AuthContext';

function renderRoute(isAuthenticated) {
  useAuth.mockReturnValue({ isAuthenticated, loading: false });
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    renderRoute(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderRoute(false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

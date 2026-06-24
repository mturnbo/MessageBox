import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import * as AuthContextModule from '../../AuthContext.jsx';

function renderWithRouter(isLoggedIn) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ isLoggedIn });
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('renders children when logged in', () => {
    renderWithRouter(true);
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('redirects to /login when not logged in', () => {
    renderWithRouter(false);
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});

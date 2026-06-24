import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import LoginModal from './LoginModal.jsx';
import * as AuthContextModule from '../../AuthContext.jsx';

function renderModal(loginMock = vi.fn()) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ login: loginMock });
  return render(
    <PrimeReactProvider>
      <LoginModal />
    </PrimeReactProvider>,
  );
}

describe('LoginModal', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders the sign-in form', () => {
    renderModal();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('calls login with username and password on submit', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue({});
    renderModal(loginMock);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({ username: 'alice', password: 'secret' }),
    );
  });

  it('shows invalid credentials error on 401', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockRejectedValue(Object.assign(new Error(), { status: 401 }));
    renderModal(loginMock);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid username or password'),
    );
  });

  it('clears password on auth error', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockRejectedValue(Object.assign(new Error(), { status: 401 }));
    renderModal(loginMock);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByLabelText(/password/i)).toHaveValue(''));
  });

  it('shows connection error for non-auth failures', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockRejectedValue(Object.assign(new Error(), { status: 500 }));
    renderModal(loginMock);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to connect'),
    );
  });
});

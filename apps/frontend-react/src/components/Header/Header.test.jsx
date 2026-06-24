import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import Header from './Header.jsx';
import * as AuthContextModule from '../../AuthContext.jsx';
import * as NotificationContextModule from '../../context/NotificationContext.jsx';

function renderHeader({ user = { username: 'alice' }, inboxUnread = 0, sentTotal = 0, logout = vi.fn(), onCompose = vi.fn() } = {}) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user, logout });
  vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({ inboxUnread, sentTotal });
  return render(
    <PrimeReactProvider>
      <MemoryRouter>
        <Header onCompose={onCompose} />
      </MemoryRouter>
    </PrimeReactProvider>,
  );
}

describe('Header', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders logo, inbox, sent, and compose buttons', () => {
    renderHeader();
    expect(screen.getByText('MessageBox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inbox/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compose/i })).toBeInTheDocument();
  });

  it('shows unread badge when inboxUnread > 0', () => {
    renderHeader({ inboxUnread: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show unread badge when inboxUnread is 0', () => {
    renderHeader({ inboxUnread: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows sent total badge when sentTotal > 0', () => {
    renderHeader({ sentTotal: 7 });
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('calls onCompose when Compose button is clicked', async () => {
    const user = userEvent.setup();
    const onCompose = vi.fn();
    renderHeader({ onCompose });
    await user.click(screen.getByRole('button', { name: /compose/i }));
    expect(onCompose).toHaveBeenCalledOnce();
  });
});

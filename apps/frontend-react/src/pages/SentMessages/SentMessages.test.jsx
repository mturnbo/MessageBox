import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import SentMessages from './SentMessages.jsx';
import * as AuthContextModule from '../../AuthContext.jsx';
import * as NotificationContextModule from '../../context/NotificationContext.jsx';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';

vi.mock('../../services/messageService.js');
vi.mock('../../services/userService.js');

const MOCK_USER = { userId: 1, username: 'alice', token: 'tok' };

const MOCK_MESSAGES = [
  {
    id: 10,
    senderId: 1,
    recipientId: 20,
    subject: 'Hey Bob',
    body: 'Just checking in',
    sentAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: 11,
    senderId: 1,
    recipientId: 21,
    subject: 'Meeting tomorrow',
    body: 'See you at 9am',
    sentAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
  },
];

const setSentTotal = vi.fn();

function renderSent() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: MOCK_USER, isLoggedIn: true });
  vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({ setSentTotal });
  vi.mocked(userService.getUser).mockImplementation((id) =>
    Promise.resolve({ id, firstName: id === 20 ? 'Bob' : 'Carol', lastName: 'Smith' }),
  );
  return render(
    <PrimeReactProvider>
      <MemoryRouter>
        <SentMessages />
      </MemoryRouter>
    </PrimeReactProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  setSentTotal.mockReset();
  vi.mocked(messageService.getSent).mockResolvedValue({
    messages: MOCK_MESSAGES,
    total: 2,
    page: 1,
    limit: 10,
  });
});

describe('SentMessages', () => {
  it('shows skeleton while loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: MOCK_USER });
    vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({ setSentTotal: vi.fn() });
    vi.mocked(messageService.getSent).mockReturnValue(new Promise(() => {}));
    vi.mocked(userService.getUser).mockResolvedValue({ id: 20, firstName: 'Bob', lastName: 'Smith' });
    render(<PrimeReactProvider><MemoryRouter><SentMessages /></MemoryRouter></PrimeReactProvider>);
    expect(document.querySelector('.p-skeleton')).not.toBeNull();
  });

  it('renders sent messages with recipient names', async () => {
    renderSent();
    await waitFor(() => expect(screen.getByText(/Bob Smith/)).toBeInTheDocument());
    expect(screen.getByText(/Carol Smith/)).toBeInTheDocument();
  });

  it('shows subjects and body previews', async () => {
    renderSent();
    await waitFor(() => expect(screen.getByText('Hey Bob')).toBeInTheDocument());
    expect(screen.getByText('Meeting tomorrow')).toBeInTheDocument();
  });

  it('calls setSentTotal with the total count', async () => {
    renderSent();
    await waitFor(() => expect(setSentTotal).toHaveBeenCalledWith(2));
  });

  it('shows empty state when no messages', async () => {
    vi.mocked(messageService.getSent).mockResolvedValue({ messages: [], total: 0, page: 1, limit: 10 });
    renderSent();
    await waitFor(() => expect(screen.getByText(/no sent messages/i)).toBeInTheDocument());
  });

  it('opens MessageViewModal when a message is clicked', async () => {
    renderSent();
    await waitFor(() => screen.getByText('Hey Bob'));
    await userEvent.click(screen.getByText('Hey Bob'));
    await waitFor(() => expect(screen.getByText('Just checking in')).toBeInTheDocument());
  });

  it('does not show unread dots or archive buttons', async () => {
    renderSent();
    await waitFor(() => screen.getByText('Hey Bob'));
    expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Archive')).not.toBeInTheDocument();
  });

  it('calls getSent with the user id', async () => {
    renderSent();
    await waitFor(() => expect(messageService.getSent).toHaveBeenCalledWith(1, 1, 10));
  });
});

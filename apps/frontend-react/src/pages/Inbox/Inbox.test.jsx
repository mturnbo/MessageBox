import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import Inbox from './Inbox.jsx';
import * as AuthContextModule from '../../AuthContext.jsx';
import * as NotificationContextModule from '../../context/NotificationContext.jsx';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';

vi.mock('../../services/messageService.js');
vi.mock('../../services/userService.js');

const MOCK_USER = { userId: 1, username: 'alice', token: 'tok' };

const MOCK_MESSAGES = [
  { id: 1, senderId: 10, recipientId: 1, subject: 'Hello', body: 'Hi there', sentAt: new Date().toISOString(), readAt: null },
  { id: 2, senderId: 11, recipientId: 1, subject: 'Read msg', body: 'Already read', sentAt: new Date().toISOString(), readAt: new Date().toISOString() },
];

function renderInbox() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: MOCK_USER, isLoggedIn: true });
  vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({
    setInboxUnread: vi.fn(),
    inboxUnread: 0,
  });
  vi.mocked(userService.getUser).mockResolvedValue({ id: 10, firstName: 'Bob', lastName: 'Smith' });
  return render(
    <PrimeReactProvider>
      <MemoryRouter>
        <Inbox />
      </MemoryRouter>
    </PrimeReactProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(messageService.getInbox).mockResolvedValue({ messages: MOCK_MESSAGES, total: 2, page: 1, limit: 10 });
});

describe('Inbox', () => {
  it('shows skeleton while loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: MOCK_USER });
    vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({ setInboxUnread: vi.fn() });
    vi.mocked(messageService.getInbox).mockReturnValue(new Promise(() => {})); // never resolves
    vi.mocked(userService.getUser).mockResolvedValue({ id: 10, firstName: 'Bob', lastName: 'Smith' });
    render(<PrimeReactProvider><MemoryRouter><Inbox /></MemoryRouter></PrimeReactProvider>);
    // Skeleton elements are present during loading
    expect(document.querySelector('.p-skeleton')).not.toBeNull();
  });

  it('renders messages after loading', async () => {
    renderInbox();
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
    expect(screen.getByText('Read msg')).toBeInTheDocument();
  });

  it('shows unread dot for unread messages', async () => {
    renderInbox();
    await waitFor(() => screen.getByText('Hello'));
    const unreads = screen.getAllByLabelText('Unread');
    expect(unreads).toHaveLength(1);
  });

  it('shows empty state when no messages', async () => {
    vi.mocked(messageService.getInbox).mockResolvedValue({ messages: [], total: 0, page: 1, limit: 10 });
    renderInbox();
    await waitFor(() => expect(screen.getByText(/inbox is empty/i)).toBeInTheDocument());
  });

  it('opens message view modal when a message is clicked', async () => {
    vi.mocked(messageService.markAsRead).mockResolvedValue({});
    renderInbox();
    await waitFor(() => screen.getByText('Hello'));
    await userEvent.click(screen.getByText('Hello'));
    await waitFor(() => expect(screen.getByText('Hi there')).toBeInTheDocument());
  });

  it('calls markAsRead when an unread message is opened', async () => {
    vi.mocked(messageService.markAsRead).mockResolvedValue({});
    renderInbox();
    await waitFor(() => screen.getByText('Hello'));
    await userEvent.click(screen.getByText('Hello'));
    await waitFor(() => expect(messageService.markAsRead).toHaveBeenCalledWith(1));
  });

  it('calls archiveMessage and removes message from list', async () => {
    vi.mocked(messageService.archiveMessage).mockResolvedValue({});
    renderInbox();
    await waitFor(() => screen.getByText('Hello'));

    const archiveBtns = screen.getAllByLabelText('Archive');
    await userEvent.click(archiveBtns[0]);

    await waitFor(() => expect(messageService.archiveMessage).toHaveBeenCalledWith(1, 1));
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});

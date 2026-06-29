import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import ComposeModal from './ComposeModal.jsx';
import * as AuthContextModule from '../../AuthContext.jsx';
import * as NotificationContextModule from '../../context/NotificationContext.jsx';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';

vi.mock('../../services/messageService.js');
vi.mock('../../services/userService.js');

const MOCK_USER = { userId: 1, username: 'alice', token: 'tok' };
const MOCK_USERS = [
  { id: 10, username: 'bob', firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com' },
  { id: 11, username: 'carol', firstName: 'Carol', lastName: 'Jones', email: 'carol@example.com' },
];

const showToast = vi.fn();
const setSentTotal = vi.fn();
const onHide = vi.fn();

function renderModal(visible = true) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: MOCK_USER });
  vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({ showToast, setSentTotal });
  vi.mocked(userService.getUsers).mockResolvedValue(MOCK_USERS);
  return render(
    <PrimeReactProvider>
      <ComposeModal visible={visible} onHide={onHide} />
    </PrimeReactProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  showToast.mockReset();
  setSentTotal.mockReset();
  onHide.mockReset();
});

describe('ComposeModal', () => {
  it('renders form fields when visible', () => {
    renderModal();
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Subject')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write your message/i)).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderModal(false);
    expect(screen.queryByPlaceholderText(/search by name/i)).not.toBeInTheDocument();
  });

  it('Send button is disabled when body is empty', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('shows autocomplete suggestions when user types', async () => {
    const user = userEvent.setup();
    renderModal();
    // Wait for users to load
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/search by name/i);
    await user.type(input, 'bob');

    await waitFor(() => expect(screen.getByText('Bob Smith')).toBeInTheDocument());
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('calls createMessage with correct payload on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(messageService.createMessage).mockResolvedValue({ id: 99 });
    renderModal();
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalled());

    // Select recipient via autocomplete
    const input = screen.getByPlaceholderText(/search by name/i);
    await user.type(input, 'bob');
    await waitFor(() => screen.getByText('Bob Smith'));
    await user.click(screen.getByText('Bob Smith'));

    // Fill body
    await user.type(screen.getByPlaceholderText(/write your message/i), 'Hello there');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(messageService.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: 1,
          recipientId: 10,
          body: 'Hello there',
        }),
      ),
    );
  });

  it('shows success toast after sending', async () => {
    const user = userEvent.setup();
    vi.mocked(messageService.createMessage).mockResolvedValue({ id: 99 });
    renderModal();
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/search by name/i);
    await user.type(input, 'bob');
    await waitFor(() => screen.getByText('Bob Smith'));
    await user.click(screen.getByText('Bob Smith'));
    await user.type(screen.getByPlaceholderText(/write your message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success' }),
      ),
    );
  });

  it('increments sentTotal after sending', async () => {
    const user = userEvent.setup();
    vi.mocked(messageService.createMessage).mockResolvedValue({ id: 99 });
    renderModal();
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/search by name/i);
    await user.type(input, 'carol');
    await waitFor(() => screen.getByText('Carol Jones'));
    await user.click(screen.getByText('Carol Jones'));
    await user.type(screen.getByPlaceholderText(/write your message/i), 'Hi Carol');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(setSentTotal).toHaveBeenCalled());
  });

  it('shows error message when createMessage fails', async () => {
    const user = userEvent.setup();
    vi.mocked(messageService.createMessage).mockRejectedValue(new Error('Network error'));
    renderModal();
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/search by name/i);
    await user.type(input, 'bob');
    await waitFor(() => screen.getByText('Bob Smith'));
    await user.click(screen.getByText('Bob Smith'));
    await user.type(screen.getByPlaceholderText(/write your message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to send message'),
    );
  });

  it('calls onHide when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onHide).toHaveBeenCalledOnce();
  });
});

const REPLY_TO = {
  id: 5,
  senderId: 10,
  senderName: 'Bob Smith',
  subject: 'Hello',
  body: 'Hi there',
  sentAt: new Date().toISOString(),
  readAt: null,
};

function renderReplyModal() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: MOCK_USER });
  vi.spyOn(NotificationContextModule, 'useNotifications').mockReturnValue({ showToast, setSentTotal });
  vi.mocked(userService.getUsers).mockResolvedValue(MOCK_USERS);
  return render(
    <PrimeReactProvider>
      <ComposeModal visible onHide={onHide} replyTo={REPLY_TO} />
    </PrimeReactProvider>,
  );
}

describe('ComposeModal — reply mode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    showToast.mockReset();
    setSentTotal.mockReset();
    onHide.mockReset();
  });

  it('shows recipient name instead of autocomplete', () => {
    renderReplyModal();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search by name/i)).not.toBeInTheDocument();
  });

  it('pre-fills subject with Re: prefix', () => {
    renderReplyModal();
    expect(screen.getByDisplayValue('Re: Hello')).toBeInTheDocument();
  });

  it('shows Reply as dialog title', () => {
    renderReplyModal();
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('calls replyToMessage with correct replyToId and recipientId', async () => {
    const user = userEvent.setup();
    vi.mocked(messageService.replyToMessage).mockResolvedValue({ id: 99 });
    renderReplyModal();

    await user.type(screen.getByPlaceholderText(/write your message/i), 'My reply');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(messageService.replyToMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          replyToId: 5,
          senderId: 1,
          recipientId: 10,
          body: 'My reply',
        }),
      ),
    );
  });
});

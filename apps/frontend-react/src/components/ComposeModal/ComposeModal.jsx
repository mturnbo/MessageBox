import { useEffect, useRef, useState } from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useAuth } from '../../AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';

const ComposeModal = ({ visible, onHide }) => {
  const { user } = useAuth();
  const { showToast, setSentTotal } = useNotifications();
  const [recipient, setRecipient] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const allUsersRef = useRef([]);

  // Load user list lazily on first open
  useEffect(() => {
    if (visible && allUsersRef.current.length === 0) {
      userService
        .getUsers(100)
        .then((users) => {
          allUsersRef.current = users.map((u) => ({
            ...u,
            displayName: `${u.firstName} ${u.lastName}`,
          }));
        })
        .catch(() => {});
    }
  }, [visible]);

  const resetForm = () => {
    setRecipient(null);
    setSubject('');
    setBody('');
    setError('');
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  const handleSearch = ({ query }) => {
    const q = query.toLowerCase();
    setSuggestions(
      allUsersRef.current.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient?.id || !body.trim()) return;
    setLoading(true);
    setError('');
    try {
      await messageService.createMessage({
        clientMessageId: crypto.randomUUID(),
        senderId: user.userId,
        recipientId: recipient.id,
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      showToast({
        severity: 'success',
        summary: 'Message sent',
        detail: `To ${recipient.displayName}`,
        life: 3000,
      });
      setSentTotal((prev) => prev + 1);
      resetForm();
      onHide();
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const itemTemplate = (u) => (
    <div className="flex items-center gap-3 py-0.5">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {u.firstName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{u.displayName}</p>
        <p className="text-xs text-gray-500 truncate">{u.email}</p>
      </div>
    </div>
  );

  const canSubmit = !!recipient?.id && !!body.trim();

  return (
    <Dialog
      header="New Message"
      visible={visible}
      onHide={handleHide}
      modal
      draggable={false}
      resizable={false}
      style={{ width: '520px' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">To</label>
          <AutoComplete
            value={recipient}
            suggestions={suggestions}
            completeMethod={handleSearch}
            field="displayName"
            itemTemplate={itemTemplate}
            onChange={(e) => setRecipient(e.value)}
            forceSelection
            placeholder="Search by name, username, or email"
            className="w-full"
            inputClassName="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Subject <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <InputText
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Message</label>
          <InputTextarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            autoResize
            required
            placeholder="Write your message…"
            className="w-full"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancel" text severity="secondary" onClick={handleHide} />
          <Button
            type="submit"
            label="Send"
            icon="pi pi-send"
            loading={loading}
            disabled={!canSubmit || loading}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default ComposeModal;

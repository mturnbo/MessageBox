import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { Skeleton } from 'primereact/skeleton';
import { useAuth } from '../../AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';
import MessageViewModal from '../../components/MessageViewModal/MessageViewModal.jsx';

const PAGE_SIZE = 10;

const avatar = (name) => (name?.[0] ?? '?').toUpperCase();

export default function Inbox() {
  const { user } = useAuth();
  const { setInboxUnread } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [first, setFirst] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const userCache = useRef(new Map());

  const enrichMessages = useCallback(async (msgs) => {
    const uniqueIds = [...new Set(msgs.map((m) => m.senderId))];
    const toFetch = uniqueIds.filter((id) => !userCache.current.has(id));
    await Promise.all(
      toFetch.map((id) =>
        userService
          .getUser(id)
          .then((u) => userCache.current.set(id, `${u.firstName} ${u.lastName}`))
          .catch(() => userCache.current.set(id, `User ${id}`)),
      ),
    );
    return msgs.map((m) => ({
      ...m,
      senderName: userCache.current.get(m.senderId) ?? `User ${m.senderId}`,
    }));
  }, []);

  const loadPage = useCallback(
    async (offset) => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const page = Math.floor(offset / PAGE_SIZE) + 1;
        const data = await messageService.getInbox(user.userId, page, PAGE_SIZE);
        const enriched = await enrichMessages(data.messages);
        setMessages(enriched);
        setTotal(data.total);
        setInboxUnread(enriched.filter((m) => !m.readAt).length);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.userId, enrichMessages, setInboxUnread],
  );

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.readAt) {
      try {
        await messageService.markAsRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, readAt: new Date().toISOString() } : m)),
        );
        setSelectedMessage((prev) => (prev?.id === msg.id ? { ...prev, readAt: new Date().toISOString() } : prev));
        setInboxUnread((prev) => Math.max(0, prev - 1));
      } catch {
        // Marking as read is best-effort
      }
    }
  };

  const handleArchive = async (e, msg) => {
    e.stopPropagation();
    try {
      await messageService.archiveMessage(msg.id, user.userId);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      setTotal((prev) => prev - 1);
      if (!msg.readAt) setInboxUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // Archive failed — leave message in list
    }
  };

  const onPageChange = (e) => {
    setFirst(e.first);
    loadPage(e.first);
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Inbox</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton shape="circle" size="2.5rem" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton width="30%" height="0.875rem" />
                <Skeleton width="60%" height="0.75rem" />
              </div>
              <Skeleton width="4rem" height="0.75rem" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Inbox
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">{total} message{total !== 1 ? 's' : ''}</span>
          )}
        </h1>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="pi pi-inbox text-5xl mb-4" />
          <p className="text-lg font-medium">Your inbox is empty</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => handleOpenMessage(msg)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenMessage(msg)}
              >
                {/* Unread dot */}
                <div className="w-2 flex-shrink-0 flex justify-center">
                  {!msg.readAt && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" aria-label="Unread" />
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {avatar(msg.senderName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${msg.readAt ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                    {msg.senderName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    <span className={msg.readAt ? '' : 'font-medium text-gray-700'}>{msg.subject || '(no subject)'}</span>
                    {msg.body && <span className="text-gray-400"> — {msg.body.slice(0, 80)}</span>}
                  </p>
                </div>

                {/* Date + archive */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(msg.sentAt).toLocaleDateString()}
                  </span>
                  <Button
                    icon="pi pi-archive"
                    text
                    size="small"
                    severity="secondary"
                    aria-label="Archive"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleArchive(e, msg)}
                  />
                </div>
              </div>
            ))}
          </div>

          {total > PAGE_SIZE && (
            <Paginator
              first={first}
              rows={PAGE_SIZE}
              totalRecords={total}
              onPageChange={onPageChange}
              className="mt-4"
            />
          )}
        </>
      )}

      <MessageViewModal
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </main>
  );
}

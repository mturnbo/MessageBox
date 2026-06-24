import { useCallback, useEffect, useRef, useState } from 'react';
import { Paginator } from 'primereact/paginator';
import { Skeleton } from 'primereact/skeleton';
import { useAuth } from '../../AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';
import MessageViewModal from '../../components/MessageViewModal/MessageViewModal.jsx';

const PAGE_SIZE = 10;

const avatar = (name) => (name?.[0] ?? '?').toUpperCase();

export default function SentMessages() {
  const { user } = useAuth();
  const { setSentTotal } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [first, setFirst] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const userCache = useRef(new Map());

  const enrichMessages = useCallback(async (msgs) => {
    const uniqueIds = [...new Set(msgs.map((m) => m.recipientId))];
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
      recipientName: userCache.current.get(m.recipientId) ?? `User ${m.recipientId}`,
    }));
  }, []);

  const loadPage = useCallback(
    async (offset) => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const page = Math.floor(offset / PAGE_SIZE) + 1;
        const data = await messageService.getSent(user.userId, page, PAGE_SIZE);
        const enriched = await enrichMessages(data.messages);
        setMessages(enriched);
        setTotal(data.total);
        setSentTotal(data.total);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.userId, enrichMessages, setSentTotal],
  );

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const onPageChange = (e) => {
    setFirst(e.first);
    loadPage(e.first);
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Sent</h1>
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
          Sent
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {total} message{total !== 1 ? 's' : ''}
            </span>
          )}
        </h1>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="pi pi-send text-5xl mb-4" />
          <p className="text-lg font-medium">No sent messages</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedMessage(msg)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedMessage(msg)}
              >
                {/* Avatar — recipient's initial */}
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {avatar(msg.recipientName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    To: <span className="font-medium">{msg.recipientName}</span>
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {msg.subject || '(no subject)'}
                    {msg.body && <span className="text-gray-400"> — {msg.body.slice(0, 80)}</span>}
                  </p>
                </div>

                {/* Date */}
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(msg.sentAt).toLocaleDateString()}
                </span>
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

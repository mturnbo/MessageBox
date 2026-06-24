import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useAuth } from '../AuthContext.jsx';
import * as notificationService from '../services/notificationService.js';
import * as messageService from '../services/messageService.js';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30_000;

export const NotificationProvider = ({ children }) => {
  const toast = useRef(null);
  const { isLoggedIn, user } = useAuth();
  const [inboxUnread, setInboxUnread] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);

  const showToast = (options) => toast.current?.show(options);

  // Reset counts and restart polling when login/logout state changes
  useEffect(() => {
    if (!isLoggedIn || !user?.userId) {
      setInboxUnread(0);
      setSentTotal(0);
      notificationService.resetLastChecked();
      return;
    }

    notificationService.resetLastChecked();

    const interval = setInterval(async () => {
      try {
        const { newMessages } = await notificationService.checkForNewMessages(
          user.userId,
          messageService.getInbox,
        );
        if (newMessages.length > 0) {
          setInboxUnread((prev) => prev + newMessages.length);
          newMessages.forEach((msg) => {
            showToast({
              severity: 'info',
              summary: 'New message',
              detail: msg.subject || '(no subject)',
              life: 5000,
            });
          });
        }
      } catch {
        // Silently skip failed polls
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isLoggedIn, user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NotificationContext.Provider value={{ inboxUnread, setInboxUnread, sentTotal, setSentTotal, showToast }}>
      <Toast ref={toast} position="top-right" />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

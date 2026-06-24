import { createContext, useContext, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const toast = useRef(null);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);

  const showToast = (options) => toast.current?.show(options);

  return (
    <NotificationContext.Provider value={{ inboxUnread, setInboxUnread, sentTotal, setSentTotal, showToast }}>
      <Toast ref={toast} position="top-right" />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

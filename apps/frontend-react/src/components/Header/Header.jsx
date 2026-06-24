import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { useAuth } from '../../AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

const Header = ({ onCompose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { inboxUnread, sentTotal } = useNotifications();
  const menuRef = useRef(null);

  const userMenuItems = [
    {
      label: user?.username ?? '',
      items: [
        {
          label: 'Sign out',
          icon: 'pi pi-sign-out',
          command: logout,
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl select-none">
            <i className="pi pi-envelope text-2xl" />
            MessageBox
          </div>

          <nav className="flex items-center gap-1">
            <div className="relative">
              <Button
                label="Inbox"
                icon="pi pi-inbox"
                text
                onClick={() => navigate('/inbox')}
              />
              {inboxUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {inboxUnread}
                </span>
              )}
            </div>

            <div className="relative">
              <Button
                label="Sent"
                icon="pi pi-send"
                text
                onClick={() => navigate('/sent')}
              />
              {sentTotal > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {sentTotal}
                </span>
              )}
            </div>

            <Button
              label="Compose"
              icon="pi pi-pencil"
              onClick={onCompose}
            />

            <Button
              aria-label={user?.username ?? 'User menu'}
              icon="pi pi-user"
              rounded
              outlined
              onClick={(e) => menuRef.current?.toggle(e)}
            />
            <Menu ref={menuRef} model={userMenuItems} popup />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

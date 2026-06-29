import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../AuthContext.jsx';
import { NotificationProvider } from '../../context/NotificationContext.jsx';
import Header from '../Header/Header.jsx';
import LoginModal from '../LoginModal/LoginModal.jsx';
import ComposeModal from '../ComposeModal/ComposeModal.jsx';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute.jsx';
import Inbox from '../../pages/Inbox/Inbox.jsx';
import SentMessages from '../../pages/SentMessages/SentMessages.jsx';

function AppShell() {
  const { isLoggedIn } = useAuth();
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const handleStartReply = (message) => {
    setReplyTo(message);
    setShowCompose(true);
  };

  const handleComposeHide = () => {
    setShowCompose(false);
    setReplyTo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoggedIn && <LoginModal />}
      {isLoggedIn && (
        <>
          <Header onCompose={() => setShowCompose(true)} />
          <ComposeModal
            visible={showCompose}
            onHide={handleComposeHide}
            replyTo={replyTo}
          />
        </>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox onStartReply={handleStartReply} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sent"
          element={
            <ProtectedRoute>
              <SentMessages onStartReply={handleStartReply} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppShell />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

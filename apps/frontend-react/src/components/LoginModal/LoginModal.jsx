import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useAuth } from '../../AuthContext.jsx';

const LoginModal = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
    } catch (err) {
      setPassword('');
      if (err.status === 401 || err.status === 400) {
        setError('Invalid username or password');
      } else {
        setError('Unable to connect. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="flex items-center gap-2">
      <i className="pi pi-envelope text-blue-600 text-xl" />
      <span>Sign in to MessageBox</span>
    </div>
  );

  return (
    <Dialog
      header={header}
      visible
      modal
      closable={false}
      draggable={false}
      resizable={false}
      style={{ width: '420px' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="mb-username" className="text-sm font-medium text-gray-700">
            Username
          </label>
          <InputText
            id="mb-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mb-password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <InputText
            id="mb-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          label="Sign In"
          loading={loading}
          disabled={!username || !password || loading}
          className="w-full"
        />
      </form>
    </Dialog>
  );
};

export default LoginModal;

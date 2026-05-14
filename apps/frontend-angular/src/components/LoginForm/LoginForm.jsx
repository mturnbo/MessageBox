import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { useAuth } from '../../AuthContext.jsx';
import './LoginForm.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { token, handleLoginSuccess, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    const LOGIN_URL = `${API_BASE_URL}/auth`;

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      if (data.token) {
        handleLoginSuccess(data.token);
        // setToken(data.token);
        // sessionStorage.setItem('authToken', data.token);
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
    <form className="max-w-sm mx-auto loginform" onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your
          username</label>
        <input type="tezt" id="username"
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
               required
               value={username}
               onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="mb-5">
        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your
          password</label>
        <input type="password" id="password"
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
               required
               value={password}
               onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-start mb-5">
        <div className="flex items-center h-5">
          <input id="remember" type="checkbox" value=""
                 className="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" />
        </div>
        <label htmlFor="remember" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Remember
          me</label>
      </div>
      <button type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit
      </button>
    </form>
</>
)
}

export default LoginForm;

import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    const LOGIN_URL = 'http://127.0.0.1:8000/auth';

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
      // Assuming your API returns the token in a 'token' field
      if (data.token) {
        setToken(data.token);
        sessionStorage.setItem('accessToken', data.token);
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <form className="loginform" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div align="right">
          <button type="submit">Log In</button>
        </div>
        <div align="center" className="tokenstr">{token}</div>
      </form>
    </>
  )
}

export default LoginForm;

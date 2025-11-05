import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config.js';
import User from '../../components/User/User';

const Users = () => {
  const { id } = useParams();
  const API_URL = `${API_BASE_URL}/users/${id}`;
  const AUTH_TOKEN = sessionStorage.getItem('authToken');
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
          },
        });

        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.log(error);
      }
    }
    getUser();
  }, []);

  return (
    <User userData={userData} />
  );
}

export default Users;
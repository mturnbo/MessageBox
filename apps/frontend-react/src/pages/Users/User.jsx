import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../services/api.js';
import User from '../../components/User/User';

const Users = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await apiFetch(`/v1/users/${id}`);
        if (res.ok) setUserData(await res.json());
      } catch (error) {
        console.error(error);
      }
    };
    getUser();
  }, [id]);

  return <User userData={userData} />;
};

export default Users;

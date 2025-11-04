import React, { useState } from 'react';
import './User.css';

const User = (userData) => {
  const {username, email, firstName, lastName} = userData;

  return <div className="user">
    <div>{username}</div>
    <div>{email}</div>
    <div>{firstName}</div>
    <div>{lastName}</div>
  </div>;
}

export default User;
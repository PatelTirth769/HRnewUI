import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext([null, () => {}]);

export const AuthProvider = ({ children }) => {
  const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : null;
  const initialUser = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || 'null') : null;
  const [auth, setAuth] = useState(initialToken ? { token: initialToken, user: initialUser } : null);
  return (<AuthContext.Provider value={[auth, setAuth]}>{children}</AuthContext.Provider>);
};

export const useAuth = () => useContext(AuthContext);

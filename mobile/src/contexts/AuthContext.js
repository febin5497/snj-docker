import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      if (t) {
        setToken(t);
        AsyncStorage.getItem('user').then((u) => {
          if (u) setUser(JSON.parse(u));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password });
    const data = res.data?.data || res.data;
    const tok = data.token || data.access_token;
    const usr = data.user || data;
    await AsyncStorage.setItem('token', tok);
    await AsyncStorage.setItem('user', JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
    return { success: true };
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.post('/api/auth/change-password', { old_password: oldPassword, new_password: newPassword });
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
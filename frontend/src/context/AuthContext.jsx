import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('hmeps_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return false;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      return true;
    } catch (error) {
      localStorage.removeItem('hmeps_token');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const token = response.data.token;
    localStorage.setItem('hmeps_token', token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed silently');
    } finally {
      localStorage.removeItem('hmeps_token');
      setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout, loadUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

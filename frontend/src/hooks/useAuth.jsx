import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.success) {
      setUser(response.data.data.user);
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      return true;
    }
    throw new Error('Login failed');
  };

  const register = async (username, password, role = 'analyst') => {
    const response = await api.post('/auth/register', { username, password, role });
    if (response.data.success) {
      if (response.data.data && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      return true;
    }
    throw new Error('Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

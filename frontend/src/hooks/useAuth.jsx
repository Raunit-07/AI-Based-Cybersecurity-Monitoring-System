import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // for initial load
  const [authLoading, setAuthLoading] = useState(false); // 🔥 login/register loading
  const [error, setError] = useState(null); // 🔥 error state

  // ================= PERSIST LOGIN =================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');

        if (res.data?.success) {
          setUser(res.data.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ================= LOGIN =================
  const login = async (email, password) => {
    setAuthLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', {
        email,
        password
      });

      if (res.data?.success) {
        setUser(res.data.data.user);
        return { success: true };
      }

      // fallback if API returns success false
      setError('Invalid credentials');
      return { success: false };

    } catch (error) {
      const message =
        error.response?.data?.message || 'Invalid credentials, try again';

      setError(message);
      return { success: false };
    } finally {
      setAuthLoading(false); // 🔥 FIX: prevents infinite loading
    }
  };

  // ================= REGISTER =================
  const register = async (username, password, role = 'analyst') => {
    setAuthLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', {
        username,
        password,
        role
      });

      if (response.data?.success) {
        return { success: true };
      }

      setError('Registration failed');
      return { success: false };

    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed';

      setError(message);
      return { success: false };
    } finally {
      setAuthLoading(false);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        authLoading, // 🔥 use this in button
        error,       // 🔥 show this in UI
        setError     // optional reset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => {
  return useContext(AuthContext);
};
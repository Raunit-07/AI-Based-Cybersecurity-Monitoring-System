import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext(null);

const PUBLIC_ROUTES = ["/login", "/register"];

export const AuthProvider = ({ children }) => {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  const fetchUser = useCallback(async () => {
    if (isPublicRoute) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await api.get("/auth/me");

      if (res?.success && res?.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isPublicRoute]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    setAuthLoading(true);
    setError(null);

    try {
      const cleanEmail = String(email || "").trim().toLowerCase();

      const res = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      if (res?.success && res?.data?.user) {
        setUser(res.data.user);

        return {
          success: true,
          user: res.data.user,
        };
      }

      const message = res?.message || "Invalid credentials";
      setError(message);

      return {
        success: false,
        message,
      };
    } catch (err) {
      const message = err?.message || "Invalid credentials, try again";
      setError(message);

      return {
        success: false,
        message,
        status: err?.status,
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email, password, confirmPassword) => {
    setAuthLoading(true);
    setError(null);

    try {
      const cleanEmail = String(email || "").trim().toLowerCase();

      const res = await api.post("/auth/register", {
        email: cleanEmail,
        password,
        confirmPassword,
      });

      if (res?.success) {
        // Auto-login: set user in context since backend already set cookies
        if (res?.data?.user) {
          setUser(res.data.user);
        }

        return {
          success: true,
          message: res?.message || "Registration successful",
          user: res?.data?.user || null,
        };
      }

      const message = res?.message || "Registration failed";
      setError(message);

      return {
        success: false,
        message,
      };
    } catch (err) {
      const message = err?.message || "Registration failed";
      setError(message);

      return {
        success: false,
        message,
        status: err?.status,
        errors: err?.errors || [],
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);

    try {
      await api.post("/auth/logout");
    } catch {
      // Clear frontend session even if backend logout fails.
    } finally {
      setUser(null);
      setError(null);
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        fetchUser,
        loading,
        authLoading,
        error,
        setError,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
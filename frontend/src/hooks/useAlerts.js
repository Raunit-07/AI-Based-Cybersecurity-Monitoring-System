import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

const PUBLIC_ROUTES = ["/login", "/register"];

const isPublicRoute = () => {
  const path = window.location.pathname;
  return PUBLIC_ROUTES.includes(path);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  /**
   * loading = initial auth check loading
   * authLoading = login/register/logout loading
   */
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ================= PERSIST LOGIN =================
   */
  const fetchUser = useCallback(async () => {
    /**
     * Do not call /auth/me on public pages.
     * This removes repeated 401 console errors on login/register pages.
     */
    if (isPublicRoute()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/auth/me");

      if (res?.success && res?.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      /**
       * Silent fail is correct here.
       * 401 simply means user is not logged in.
       */
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * ================= LOGIN =================
   */
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
      const message = err?.message || "Invalid credentials";

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

  /**
   * ================= REGISTER =================
   */
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
        return {
          success: true,
          message: res?.message || "Registration successful",
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

  /**
   * ================= LOGOUT =================
   */
  const logout = async () => {
    setAuthLoading(true);

    try {
      await api.post("/auth/logout");
    } catch {
      /**
       * Even if backend logout fails, clear frontend session.
       */
    } finally {
      setUser(null);
      setError(null);
      setAuthLoading(false);
    }
  };

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * ================= HOOK =================
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
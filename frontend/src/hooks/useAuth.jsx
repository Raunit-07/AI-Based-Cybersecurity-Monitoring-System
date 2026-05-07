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

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

export const AuthProvider = ({
  children,
}) => {
  const location = useLocation();

  // ================= STATE =================
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [authLoading, setAuthLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const isPublicRoute =
    PUBLIC_ROUTES.includes(
      location.pathname
    );

  // ================= STORE USER SESSION =================
  const storeUserSession = (
    userData
  ) => {
    if (!userData) return;

    // 🔥 Store safe user data
    localStorage.setItem(
      "threatops_user",
      JSON.stringify({
        id:
          userData._id ||
          userData.id,

        email:
          userData.email,

        apiKey:
          userData.apiKey ||
          "",

        role:
          userData.role ||
          "user",
      })
    );
  };

  // ================= CLEAR SESSION =================
  const clearUserSession =
    () => {
      localStorage.removeItem(
        "threatops_user"
      );
    };

  // ================= FETCH CURRENT USER =================
  const fetchUser =
    useCallback(async () => {
      if (isPublicRoute) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res =
          await api.get(
            "/auth/me"
          );

        if (
          res?.success &&
          res?.data?.user
        ) {
          setUser(
            res.data.user
          );

          // 🔥 Persist user session
          storeUserSession(
            res.data.user
          );
        } else {
          setUser(null);
          clearUserSession();
        }
      } catch {
        setUser(null);

        clearUserSession();
      } finally {
        setLoading(false);
      }
    }, [isPublicRoute]);

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ================= LOGIN =================
  const login = async (
    email,
    password
  ) => {
    setAuthLoading(true);

    setError(null);

    try {
      const cleanEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      const res =
        await api.post(
          "/auth/login",
          {
            email:
              cleanEmail,
            password,
          }
        );

      if (
        res?.success &&
        res?.data?.user
      ) {
        const userData =
          res.data.user;

        setUser(userData);

        // 🔥 Save session locally
        storeUserSession(
          userData
        );

        return {
          success: true,
          user: userData,
        };
      }

      const message =
        res?.message ||
        "Invalid credentials";

      setError(message);

      return {
        success: false,
        message,
      };
    } catch (err) {
      const message =
        err?.message ||
        "Invalid credentials, try again";

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

  // ================= REGISTER =================
  const register = async (
    email,
    password,
    confirmPassword
  ) => {
    setAuthLoading(true);

    setError(null);

    try {
      const cleanEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      const res =
        await api.post(
          "/auth/register",
          {
            email:
              cleanEmail,
            password,
            confirmPassword,
          }
        );

      if (res?.success) {
        // 🔥 Auto-login
        if (
          res?.data?.user
        ) {
          const userData =
            res.data.user;

          setUser(userData);

          // 🔥 Persist session
          storeUserSession(
            userData
          );
        }

        return {
          success: true,

          message:
            res?.message ||
            "Registration successful",

          user:
            res?.data
              ?.user ||
            null,
        };
      }

      const message =
        res?.message ||
        "Registration failed";

      setError(message);

      return {
        success: false,
        message,
      };
    } catch (err) {
      const message =
        err?.message ||
        "Registration failed";

      setError(message);

      return {
        success: false,
        message,
        status:
          err?.status,
        errors:
          err?.errors ||
          [],
      };
    } finally {
      setAuthLoading(false);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    setAuthLoading(true);

    try {
      await api.post(
        "/auth/logout"
      );
    } catch {
      // Ignore backend logout failure
    } finally {
      setUser(null);

      setError(null);

      // 🔥 Clear local session
      clearUserSession();

      setAuthLoading(false);
    }
  };

  // ================= CONTEXT =================
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

        isAuthenticated:
          Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
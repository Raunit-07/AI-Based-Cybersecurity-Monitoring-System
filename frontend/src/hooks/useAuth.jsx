import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { useLocation } from "react-router-dom";

import {
  useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";

import {
  disconnectSocket,
} from "../services/socket";

const AuthContext = createContext(null);

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

export const AuthProvider = ({
  children,
}) => {
  const location = useLocation();

  const queryClient =
    useQueryClient();

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

    // ✅ Store only safe fields
    localStorage.setItem(
      "threatops_user",
      JSON.stringify({
        id:
          userData._id ||
          userData.id,

        email:
          userData.email,

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
          const userData =
            res.data.user;

          setUser(userData);

          // ✅ Persist safe session
          storeUserSession(
            userData
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
        "Invalid credentials";

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
        const userData =
          res?.data?.user ||
          null;

        if (userData) {
          setUser(userData);

          storeUserSession(
            userData
          );
        }

        return {
          success: true,
          message:
            res?.message ||
            "Registration successful",
          user: userData,
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
      // Ignore backend failure
    } finally {
      // ✅ Clear frontend auth state
      setUser(null);

      setError(null);

      // ✅ Remove local storage
      clearUserSession();

      // ✅ CRITICAL: clear React Query cache
      queryClient.clear();

      // ✅ CRITICAL: disconnect socket
      disconnectSocket();

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
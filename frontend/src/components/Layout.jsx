import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Shield,
  Activity,
  AlertTriangle,
  LogOut,
  Bell,
  Cpu,
  Clock,
  BarChart2,
  X,
  Laptop,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSocket } from "../services/socket";

export const Layout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  // Setup Socket listeners for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const addNotification = (item) => {
      // Add to list of notifications (capped at 50)
      setNotifications((prev) => [item, ...prev].slice(0, 50));

      // Add to temporary toast alerts list
      const toastId = Math.random().toString(36).substring(2, 9);
      const newToast = { ...item, toastId };
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
      }, 6000);
    };

    // 1. Live Threat Alert Event
    const handleNewAlert = (alert) => {
      if (alert.user && alert.user !== user.id) return;

      addNotification({
        id: alert.id || Math.random().toString(),
        title: `${alert.attackType || "Suspicious"} Alert`,
        message: alert.message || "Malicious traffic signature detected.",
        type: "alert",
        severity: alert.severity || "medium",
        source: alert.ip || "Agent",
        timestamp: new Date()
      });
    };

    // 2. Live Device Registration / Online Status Event
    const handleDeviceOnline = (device) => {
      addNotification({
        id: device.deviceId || Math.random().toString(),
        title: "Endpoint Online",
        message: `Device ${device.hostname || "unknown"} (${device.os || "OS"}) is online.`,
        type: "device",
        severity: "info",
        source: device.hostname || "unknown",
        timestamp: new Date()
      });
    };

    socket.on("new_alert", handleNewAlert);
    socket.on("device_online", handleDeviceOnline);

    return () => {
      socket.off("new_alert", handleNewAlert);
      socket.off("device_online", handleDeviceOnline);
    };
  }, [user?.id]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: Activity },
    { name: "Alerts", path: "/alerts", icon: AlertTriangle },
    { name: "Devices", path: "/devices", icon: Laptop },
    { name: "Timeline", path: "/timeline", icon: Clock },
    { name: "Analytics", path: "/analytics", icon: BarChart2 }
  ];

  const unreadCount = notifications.length;

  return (
    <div className="flex h-screen bg-[#020617] text-gray-100 font-sans relative">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#090d1f] border-r border-slate-800/80 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/65">
          <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
          <span className="text-xl font-bold tracking-wider">
            THREAT<span className="text-blue-500">OPS</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-md shadow-blue-500/5 font-semibold"
                    : "text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile / Logout section */}
        <div className="p-4 border-t border-slate-800/65 bg-[#070a1a]">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Operator
              </p>
              <p className="text-sm text-slate-300 truncate font-semibold">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/15 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* TOP PANEL */}
        <header className="h-16 border-b border-slate-800/80 bg-[#090d1f]/60 backdrop-blur flex items-center justify-end px-6 gap-4 z-20">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl relative transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </header>

        {/* PAGE SCREEN CONTAINER */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* ================= NOTIFICATIONS SIDE DRAWER ================= */}
      {isDrawerOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-96 bg-[#090d1f] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold">Live Activity Log</h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <Bell className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No live notifications yet.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border bg-slate-900/60 text-slate-200 transition-all ${
                      n.type === "alert"
                        ? n.severity === "critical"
                          ? "border-red-500/30 hover:border-red-500/50"
                          : "border-yellow-500/30 hover:border-yellow-500/50"
                        : "border-blue-500/30 hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        {n.type === "alert" ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Cpu className="w-4 h-4 text-blue-400" />
                        )}
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {n.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                    {n.type === "alert" && (
                      <div className="mt-2 flex gap-1.5 items-center">
                        <span className="text-[9px] font-semibold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          Source: {n.source}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            n.severity === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : n.severity === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {n.severity}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-[#070a1a]">
              <button
                onClick={() => setNotifications([])}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING TOAST POPUPS ================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.toastId}
            className="bg-[#0b0f19]/90 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex gap-3 animate-slide-in-right hover:border-slate-700 transition-all"
          >
            {t.type === "alert" ? (
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-red-500">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-sm text-white truncate">{t.title}</h5>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((o) => o.toastId !== t.toastId))}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Layout;

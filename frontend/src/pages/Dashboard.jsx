import React from "react";
import { TrafficChart } from "../components/TrafficChart";
import { AlertsList } from "../components/AlertsList";
import { SuspiciousIPsTable } from "../components/SuspiciousIPsTable";

import { fetchAlerts, fetchDevices } from "../services/api";
import { useSuspiciousIPs } from "../hooks/useThreatData";
import { useLiveTraffic } from "../hooks/useLiveTraffic";
import ThreatTimeline from "../components/ThreatTimeline";
import SuspiciousIPs from "../components/SuspiciousIPs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";

import { Shield, AlertTriangle, Activity, Database, Laptop } from "lucide-react";

// ================= MAIN COMPONENT =================
export const Dashboard = () => {
  const { user } = useAuth();
  const { trafficData, isConnected } = useLiveTraffic();

  // ================= ALERTS VIA REACT QUERY =================
  // Same cache key ["alerts", user._id] that useLiveTraffic writes socket alerts into
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: fetchAlerts,
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // ================= DEVICES VIA REACT QUERY =================
  const { data: devices = [], isLoading: loadingDevices } = useQuery({
    queryKey: ["devices", user?.id],
    queryFn: fetchDevices,
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // ================= SUSPICIOUS IPS =================
  const { data: ips = [], isLoading: isLoadingIPs } = useSuspiciousIPs();

  // ================= SAFE DATA =================
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeIPs = Array.isArray(ips) ? ips : [];
  const safeDevices = Array.isArray(devices) ? devices : [];
  const onlineDevices = safeDevices.filter((d) => d.status === "online").length;

  // ================= STATS =================

  const activeThreats = new Set(
    safeAlerts
      .filter(
        (a) =>
          a?.timestamp &&
          Date.now() - new Date(a.timestamp).getTime() < 5 * 60 * 1000
      )
      .map((a) => a.ip)
  ).size;

  const criticalAlerts = safeAlerts.filter(
    (a) => a?.anomalyScore !== undefined && a.anomalyScore > 0.4
  ).length;

  const currentRequests =
    trafficData.length > 0
      ? trafficData[trafficData.length - 1]?.requests || 0
      : safeAlerts.length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="relative z-10 p-6 space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              System Overview
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time threat monitoring and network analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full border border-gray-800 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                }`}
            />
            <span className="text-gray-300">
              {isConnected ? "System Online" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Active Threats"
            value={activeThreats}
            icon={<Shield className="w-6 h-6 text-yellow-400" />}
          />

          <StatCard
            title="Critical Alerts"
            value={criticalAlerts}
            icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          />

          <StatCard
            title="Live Traffic (req/s)"
            value={currentRequests}
            icon={<Activity className="w-6 h-6 text-blue-400" />}
          />

          <StatCard
            title="Active Devices"
            value={`${onlineDevices}/${safeDevices.length}`}
            icon={<Laptop className="w-6 h-6 text-green-400" />}
          />

          <StatCard
            title="Monitored IPs"
            value={safeIPs.length}
            icon={<Database className="w-6 h-6 text-purple-400" />}
          />
        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TRAFFIC CHART */}
          <div className="lg:col-span-2">
            <TrafficChart data={trafficData || []} />
          </div>

          {/* ALERTS */}
          <div className="h-[400px] overflow-hidden">
            {loadingAlerts ? (
              <Loader />
            ) : (
              <AlertsList alerts={safeAlerts} limit={6} />
            )}
          </div>
        </div>

        {/* ================= DEVICE STATUS CARDS ================= */}
        <div className="w-full">
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-500" />
              Connected Agents Status
            </h2>
            {loadingDevices ? (
              <div className="text-gray-400 text-sm">Loading agents...</div>
            ) : safeDevices.length === 0 ? (
              <div className="text-gray-400 text-sm">No agent devices registered.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {safeDevices.map((d) => (
                  <div
                    key={d._id || d.deviceId}
                    className="p-4 rounded-xl border border-gray-800 bg-black/45 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-sm truncate">{d.hostname || d.deviceId}</span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            d.status === "online" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">OS: {d.os || "Unknown"}</p>
                      {d.metadata && (
                        <div className="mt-2 text-xs text-gray-400 flex gap-4">
                          <span>CPU: {d.metadata.cpuUsage ?? d.metadata.systemInfo?.cpuUsage ?? 0}%</span>
                          <span>RAM: {d.metadata.memoryUsage ?? d.metadata.systemInfo?.memoryUsage ?? 0}%</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Seen: {d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString() : "Never"}</span>
                      <span className="text-red-400 font-semibold">Threats: {d.threatCount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= IP TABLE ================= */}
        <div className="w-full">
          {isLoadingIPs ? (
            <Loader />
          ) : (
            <SuspiciousIPsTable ips={safeIPs} />
          )}
        </div>

        {/* ================= ADVANCED SUSPICIOUS IP ANALYTICS ================= */}
        <div className="w-full">
          <SuspiciousIPs />
        </div>

        {/* ================= THREAT TIMELINE ================= */}
        <div className="w-full">
          <ThreatTimeline />
        </div>
      </div>
    </div>
  );
};

// ================= UI COMPONENTS =================
const StatCard = ({ title, value, icon }) => (
  <div className="bg-surface border border-gray-800 rounded-xl p-6 flex justify-between">
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-white">
        {value ?? 0}
      </h3>
    </div>
    <div className="p-3 bg-gray-800 rounded-lg">{icon}</div>
  </div>
);

const Loader = () => (
  <div className="h-full bg-surface border border-gray-800 rounded-xl flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
  </div>
);
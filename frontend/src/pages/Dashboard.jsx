import React from "react";
import { TrafficChart } from "../components/TrafficChart";
import { AlertsList } from "../components/AlertsList";
import { SuspiciousIPsTable } from "../components/SuspiciousIPsTable";
import { useAlerts, useSuspiciousIPs } from "../hooks/useThreatData";
import { useLiveTraffic } from "../hooks/useLiveTraffic";
import { Shield, AlertTriangle, Activity, Database } from "lucide-react";

export const Dashboard = () => {
  const { data: alerts = [], isLoading: isLoadingAlerts } = useAlerts();
  const { data: ips = [], isLoading: isLoadingIPs } = useSuspiciousIPs();
  const { trafficData = [], isConnected } = useLiveTraffic();

  // ✅ SAFE ARRAY
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  // ✅ FIXED (no status field in DB)
  const criticalAlerts = safeAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).length;

  const activeThreats = criticalAlerts;

  const currentRequests =
    trafficData.length > 0
      ? trafficData[trafficData.length - 1].requests
      : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Content container with z-index: 10 */}
      <div className="relative z-10 p-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">System Overview</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time threat monitoring and network analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full border border-gray-800 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-gray-300">
              {isConnected ? "System Online" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            title="Monitored IPs"
            value={ips.length}
            icon={<Database className="w-6 h-6 text-green-400" />}
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrafficChart data={trafficData} />
          </div>

          <div className="h-[400px]">
            {isLoadingAlerts ? (
              <Loader />
            ) : (
              <AlertsList alerts={safeAlerts} limit={6} />
            )}
          </div>
        </div>

        {/* IP TABLE */}
        <div className="w-full">
          {isLoadingIPs ? (
            <Loader />
          ) : (
            <SuspiciousIPsTable ips={ips} />
          )}
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
      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
    <div className="p-3 bg-gray-800 rounded-lg">{icon}</div>
  </div>
);

const Loader = () => (
  <div className="h-full bg-surface border border-gray-800 rounded-xl flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
  </div>
);
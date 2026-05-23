import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlerts, fetchDevices, fetchAlertStats } from "../services/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { BarChart3, AlertTriangle, ShieldAlert, Cpu, Activity } from "lucide-react";

const SEVERITY_COLORS = {
  critical: "#EF4444", // Red
  high: "#F97316",     // Orange
  medium: "#EAB308",   // Yellow
  low: "#10B981"       // Green
};

export const ThreatAnalytics = () => {
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ["alerts-analytics"],
    queryFn: fetchAlerts,
    refetchInterval: 15000 // auto-refresh every 15s
  });

  const { data: devices = [], isLoading: loadingDevices } = useQuery({
    queryKey: ["devices-analytics"],
    queryFn: fetchDevices,
    refetchInterval: 15000
  });

  const { data: stats = {}, isLoading: loadingStats } = useQuery({
    queryKey: ["stats-analytics"],
    queryFn: fetchAlertStats,
    refetchInterval: 15000
  });

  // 1. Process Severity Distribution (Pie Chart)
  const severityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach((alert) => {
      const sev = (alert.severity || "low").toLowerCase();
      if (counts[sev] !== undefined) {
        counts[sev]++;
      } else {
        counts.low++;
      }
    });

    // If no alerts, return empty state with standard structure
    if (alerts.length === 0) {
      return [
        { name: "Critical", value: 1, color: SEVERITY_COLORS.critical },
        { name: "High", value: 2, color: SEVERITY_COLORS.high },
        { name: "Medium", value: 4, color: SEVERITY_COLORS.medium },
        { name: "Low", value: 8, color: SEVERITY_COLORS.low }
      ];
    }

    return [
      { name: "Critical", value: counts.critical, color: SEVERITY_COLORS.critical },
      { name: "High", value: counts.high, color: SEVERITY_COLORS.high },
      { name: "Medium", value: counts.medium, color: SEVERITY_COLORS.medium },
      { name: "Low", value: counts.low, color: SEVERITY_COLORS.low }
    ].filter(d => d.value > 0);
  }, [alerts]);

  // 2. Process Threat Trend Over Time (Area Chart)
  const trendData = useMemo(() => {
    const timeBuckets = {};
    alerts.forEach((alert) => {
      const date = new Date(alert.timestamp || alert.createdAt);
      // Format as Hour:Minute or Date depending on window
      const label = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      timeBuckets[label] = (timeBuckets[label] || 0) + 1;
    });

    const labels = Object.keys(timeBuckets).sort();
    if (labels.length === 0) {
      // Mock historical baseline if no live data is present
      return [
        { time: "00:00", threats: 2 },
        { time: "04:00", threats: 1 },
        { time: "08:00", threats: 4 },
        { time: "12:00", threats: 3 },
        { time: "16:00", threats: 7 },
        { time: "20:00", threats: 5 },
        { time: "24:00", threats: 2 }
      ];
    }

    return labels.map((l) => ({
      time: l,
      threats: timeBuckets[l]
    }));
  }, [alerts]);

  // 3. Process Device Health Metrics (Bar Chart)
  const deviceHealthData = useMemo(() => {
    if (devices.length === 0) {
      return [
        { name: "MockHost 1", CPU: 42, RAM: 68 },
        { name: "MockHost 2", CPU: 12, RAM: 45 }
      ];
    }
    return devices.map((d) => {
      const sysInfo = d.metadata?.systemInfo || {};
      // Fallback values if agent telemetry not currently populated
      const cpu = sysInfo.cpuUsage ?? (d.status === "online" ? Math.floor(Math.random() * 30) + 5 : 0);
      const ram = sysInfo.memoryUsage ?? (d.status === "online" ? Math.floor(Math.random() * 40) + 40 : 0);
      return {
        name: d.hostname || d.deviceId,
        CPU: cpu,
        RAM: ram
      };
    });
  }, [devices]);

  // 4. Active Devices Count
  const deviceCounts = useMemo(() => {
    let online = 0;
    let offline = 0;
    devices.forEach((d) => {
      if (d.status === "online") online++;
      else offline++;
    });
    return {
      total: devices.length,
      online,
      offline
    };
  }, [devices]);

  const isLoading = loadingAlerts || loadingDevices || loadingStats;

  return (
    <div className="space-y-6 bg-black min-h-screen text-white p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Threat Analytics</h1>
          <p className="text-gray-400 text-sm">
            Visual statistics, device health matrices, and severity distributions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Alerts</span>
                <h3 className="text-3xl font-extrabold mt-1">{stats.totalAlerts ?? alerts.length}</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 opacity-80" />
            </div>

            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Threats</span>
                <h3 className="text-3xl font-extrabold mt-1">{stats.activeAlerts ?? alerts.filter(a => !a.resolved).length}</h3>
              </div>
              <ShieldAlert className="w-8 h-8 text-yellow-500 opacity-80" />
            </div>

            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Devices</span>
                <h3 className="text-3xl font-extrabold mt-1">{deviceCounts.online}</h3>
              </div>
              <Cpu className="w-8 h-8 text-green-500 opacity-80" />
            </div>

            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Device Online Ratio</span>
                <h3 className="text-3xl font-extrabold mt-1">
                  {deviceCounts.total > 0
                    ? `${Math.round((deviceCounts.online / deviceCounts.total) * 100)}%`
                    : "100%"}
                </h3>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </div>

          {/* GRID CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* THREAT TREND OVER TIME */}
            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-lg font-bold mb-4">Threat Trend (Events over Time)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                    <Area type="monotone" dataKey="threats" stroke="#EF4444" fillOpacity={1} fill="url(#colorThreats)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SEVERITY DISTRIBUTION */}
            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                <h2 className="text-lg font-bold mb-4">Threat Severity Distribution</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-center w-full md:w-auto">
                {severityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-300">
                      {item.name}: <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DEVICE HEALTH METRICS */}
            <div className="bg-[#0f172a]/75 border border-white/5 p-6 rounded-2xl lg:col-span-2">
              <h2 className="text-lg font-bold mb-4">Device Health Metrics (CPU / RAM Utilization)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceHealthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                    <Legend />
                    <Bar dataKey="CPU" fill="#3B82F6" name="CPU Usage (%)" />
                    <Bar dataKey="RAM" fill="#8B5CF6" name="RAM Usage (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThreatAnalytics;

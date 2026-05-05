import React from "react";
import { AlertCircle, ShieldAlert, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const AlertsList = ({ alerts = [], limit }) => {
  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  // ================= SAFE SEVERITY =================
  const normalizeSeverity = (severity) => {
    if (!severity || typeof severity !== "string") return "low";
    return severity.toLowerCase();
  };

  // ================= COLOR =================
  const getSeverityColor = (severity) => {
    const level = normalizeSeverity(severity);

    switch (level) {
      case "critical":
        return "text-danger bg-danger/10 border-danger/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-warning bg-warning/10 border-warning/20";
      case "low":
        return "text-success bg-success/10 border-success/20";
      default:
        return "text-gray-400 bg-gray-800 border-gray-700";
    }
  };

  // ================= ICON =================
  const getSeverityIcon = (severity) => {
    const level = normalizeSeverity(severity);

    switch (level) {
      case "critical":
        return <ShieldAlert className="w-5 h-5 text-danger" />;
      case "high":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <Shield className="w-5 h-5 text-success" />;
    }
  };

  // ================= SAFE TIME =================
  const formatTime = (time) => {
    try {
      return formatDistanceToNow(new Date(time), { addSuffix: true });
    } catch {
      return "just now";
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-lg font-semibold tracking-wide">Recent Alerts</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Shield className="w-12 h-12 mb-2 opacity-50" />
            <p>No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((alert) => {
              const severity = normalizeSeverity(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border flex items-start gap-4 transition-all hover:scale-[1.01] ${getSeverityColor(
                    severity
                  )}`}
                >
                  <div className="mt-1">
                    {getSeverityIcon(severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">
                        {alert.type || "Unknown Threat"}
                      </h3>

                      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                        {severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm opacity-80">
                      <span className="truncate">
                        Source: {alert.ip || "N/A"}
                      </span>

                      <span className="whitespace-nowrap ml-2">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
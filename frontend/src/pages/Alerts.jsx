import React from "react";
import { AlertsList } from "../components/AlertsList";
import { useAlerts } from "../hooks/useThreatData";

export const Alerts = () => {
  const { data: alerts = [], isLoading } = useAlerts();

  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Alerts</h1>
        <p className="text-gray-400 text-sm mt-1">
          Complete history of security events and anomalies.
        </p>
      </div>

      <div className="h-[calc(100vh-160px)]">
        {isLoading ? (
          <div className="h-full bg-surface border border-gray-800 rounded-xl flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        ) : (
          <AlertsList alerts={safeAlerts} />
        )}
      </div>
    </div>
  );
};
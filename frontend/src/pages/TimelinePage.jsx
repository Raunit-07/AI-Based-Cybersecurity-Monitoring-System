import React from "react";
import ThreatTimeline from "../components/ThreatTimeline";
import { Clock } from "lucide-react";

export const TimelinePage = () => {
  return (
    <div className="space-y-6 bg-black min-h-screen text-white p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Events Timeline</h1>
          <p className="text-gray-400 text-sm">
            Live historical feed of all incoming alerts, scans, and system anomalies.
          </p>
        </div>
      </div>

      {/* TIMELINE WRAPPER */}
      <div className="w-full">
        <ThreatTimeline />
      </div>
    </div>
  );
};

export default TimelinePage;

import React from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * ==========================================
 * LIVE TRAFFIC CHART
 * ==========================================
 */
export const TrafficChart = ({
  data = [],
}) => {
  // ================= SAFE DATA =================
  const safeData =
    Array.isArray(data)
      ? data
      : [];

  // ================= FORMAT TIME =================
  const formatTime = (
    value
  ) => {
    try {
      return new Date(
        value
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-800 p-6 h-[420px] flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-wide">
          Live Traffic
        </h2>

        <div className="flex gap-4 text-sm">

          {/* REQUESTS */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>

            <span className="text-gray-400">
              Requests
            </span>
          </div>

          {/* BLOCKED */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>

            <span className="text-gray-400">
              Blocked
            </span>
          </div>
        </div>
      </div>

      {/* ================= CHART ================= */}
      <div className="flex-1 min-h-[300px] w-full">

        {safeData.length === 0 ? (
          // ================= EMPTY STATE =================
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No traffic data available
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={safeData}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >

              {/* ================= GRADIENTS ================= */}
              <defs>

                <linearGradient
                  id="colorRequests"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#3B82F6"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="95%"
                    stopColor="#3B82F6"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="colorBlocked"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#EF4444"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="95%"
                    stopColor="#EF4444"
                    stopOpacity={0}
                  />
                </linearGradient>

              </defs>

              {/* ================= GRID ================= */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F2937"
                vertical={false}
              />

              {/* ================= X AXIS ================= */}
              <XAxis
                dataKey="time"
                tickFormatter={
                  formatTime
                }
                stroke="#4B5563"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />

              {/* ================= Y AXIS ================= */}
              <YAxis
                stroke="#4B5563"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />

              {/* ================= TOOLTIP ================= */}
              <Tooltip
                labelFormatter={
                  formatTime
                }

                contentStyle={{
                  backgroundColor:
                    "#111827",

                  borderColor:
                    "#374151",

                  borderRadius:
                    "8px",
                }}

                labelStyle={{
                  color: "#9CA3AF",
                }}

                itemStyle={{
                  color: "#F3F4F6",
                }}
              />

              {/* ================= REQUEST AREA ================= */}
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRequests)"
                isAnimationActive={false}
              />

              {/* ================= BLOCKED AREA ================= */}
              <Area
                type="monotone"
                dataKey="blocked"
                stroke="#EF4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorBlocked)"
                isAnimationActive={false}
              />

            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
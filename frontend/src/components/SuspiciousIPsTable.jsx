import React from "react";
import { formatDistanceToNow } from "date-fns";

/**
 * =====================================
 * Suspicious IPs Table
 * =====================================
 */
export const SuspiciousIPsTable = ({
  ips = [],
}) => {
  /**
   * =====================================
   * Safe Date Formatter
   * =====================================
   */
  const formatSafeDate = (date) => {
    if (!date) return "Unknown";

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return "Unknown";
    }

    return formatDistanceToNow(
      parsed,
      {
        addSuffix: true,
      }
    );
  };

  /**
   * =====================================
   * Risk Bar Color
   * =====================================
   */
  const getRiskColor = (
    score
  ) => {
    if (score >= 90) {
      return "bg-red-500";
    }

    if (score >= 70) {
      return "bg-orange-500";
    }

    if (score >= 40) {
      return "bg-yellow-500";
    }

    return "bg-green-500";
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-lg font-semibold tracking-wide text-white">
          Suspicious IPs
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          {/* Table Head */}
          <thead className="bg-gray-800/50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">
                IP Address
              </th>

              <th className="px-6 py-4 font-medium">
                Threat Score
              </th>

              <th className="px-6 py-4 font-medium">
                Severity
              </th>

              <th className="px-6 py-4 font-medium">
                Attack Count
              </th>

              <th className="px-6 py-4 font-medium">
                Last Seen
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-800">
            {ips?.map((ip, index) => {
              /**
               * =====================================
               * Backward Compatibility
               * =====================================
               */
              const threatScore =
                ip.threatScore ??
                ip.score ??
                0;

              const latestAttack =
                ip.latestAttack ??
                ip.lastSeen ??
                null;

              return (
                <tr
                  key={`${ip.ip}-${index}`}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  {/* IP */}
                  <td className="px-6 py-4 font-medium text-gray-200">
                    {ip.ip || "Unknown"}
                  </td>

                  {/* Threat Score */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-700 rounded-full h-1.5 max-w-[70px]">
                        <div
                          className={`h-1.5 rounded-full ${getRiskColor(
                            threatScore
                          )}`}
                          style={{
                            width: `${Math.min(
                              threatScore,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="text-gray-200">
                        {threatScore}
                      </span>
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${ip.severity ===
                          "critical"
                          ? "bg-red-500/20 text-red-400"
                          : ip.severity ===
                            "high"
                            ? "bg-orange-500/20 text-orange-400"
                            : ip.severity ===
                              "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                        }`}
                    >
                      {ip.severity ||
                        "low"}
                    </span>
                  </td>

                  {/* Attack Count */}
                  <td className="px-6 py-4 text-gray-300">
                    {ip.attackCount ??
                      0}
                  </td>

                  {/* Last Seen */}
                  <td className="px-6 py-4">
                    {formatSafeDate(
                      latestAttack
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {(!ips ||
              ips.length ===
              0) && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No suspicious IPs detected.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
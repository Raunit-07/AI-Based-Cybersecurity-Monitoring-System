import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export const SuspiciousIPsTable = ({ ips }) => {
  return (
    <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-lg font-semibold tracking-wide">Suspicious IPs</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">IP Address</th>
              <th className="px-6 py-4 font-medium">Risk Score</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {ips?.map((ip, i) => (
              <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">
                  {ip.ip}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5 max-w-[60px]">
                      <div 
                        className={`h-1.5 rounded-full ${ip.score > 90 ? 'bg-danger' : ip.score > 70 ? 'bg-orange-500' : 'bg-warning'}`}
                        style={{ width: `${ip.score}%` }}
                      ></div>
                    </div>
                    <span>{ip.score}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{ip.location}</td>
                <td className="px-6 py-4">
                  {formatDistanceToNow(new Date(ip.lastSeen), { addSuffix: true })}
                </td>
              </tr>
            ))}
            {(!ips || ips.length === 0) && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
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

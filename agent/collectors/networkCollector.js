import { exec } from 'child_process';
import os from 'os';

export const collectNetworkConnections = () => {
  return new Promise((resolve) => {
    const platform = os.platform();
    if (platform === 'win32') {
      exec('netstat -ano', (error, stdout) => {
        if (error) return resolve([]);
        const connections = [];
        const lines = stdout.split('\r\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('TCP') && !trimmed.startsWith('UDP')) continue;
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 4) {
            connections.push({
              protocol: parts[0],
              localAddress: parts[1],
              foreignAddress: parts[2],
              state: parts[0] === 'TCP' ? parts[3] : '',
              pid: parseInt(parts[parts.length - 1], 10) || 0,
            });
          }
        }
        resolve(connections);
      });
    } else {
      exec('netstat -anp 2>/dev/null || netstat -an', (error, stdout) => {
        if (error) return resolve([]);
        const connections = [];
        const lines = stdout.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('tcp') && !trimmed.startsWith('udp')) continue;
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 5) {
            connections.push({
              protocol: parts[0].toUpperCase(),
              localAddress: parts[3],
              foreignAddress: parts[4],
              state: parts.length >= 6 ? parts[5] : '',
              pid: parsePidFromComm(parts[parts.length - 1]),
            });
          }
        }
        resolve(connections);
      });
    }
  });
};

function parsePidFromComm(comm) {
  if (!comm || comm === '-') return 0;
  const match = comm.match(/^(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}

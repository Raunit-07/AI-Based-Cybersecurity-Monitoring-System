import { exec } from 'child_process';
import os from 'os';

export const collectProcesses = () => {
  return new Promise((resolve) => {
    const platform = os.platform();
    if (platform === 'win32') {
      exec('tasklist /FO CSV /NH', (error, stdout) => {
        if (error) {
          return resolve([]);
        }
        const processes = [];
        const lines = stdout.split('\r\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          const parts = line.split('","').map(p => p.replace(/"/g, ''));
          if (parts.length >= 2) {
            processes.push({
              pid: parseInt(parts[1], 10) || 0,
              name: parts[0],
              memUsage: parts[4] || '',
            });
          }
        }
        resolve(processes);
      });
    } else {
      exec('ps -ao pid,ppid,comm,%cpu,%mem', (error, stdout) => {
        if (error) {
          exec('ps aux', (errorAux, stdoutAux) => {
            if (errorAux) return resolve([]);
            resolve(parsePsAux(stdoutAux));
          });
          return;
        }
        const processes = [];
        const lines = stdout.split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(/\s+/);
          if (parts.length >= 5) {
            processes.push({
              pid: parseInt(parts[0], 10) || 0,
              ppid: parseInt(parts[1], 10) || 0,
              name: parts.slice(2, parts.length - 2).join(' '),
              cpu: parseFloat(parts[parts.length - 2]) || 0,
              mem: parseFloat(parts[parts.length - 1]) || 0,
            });
          }
        }
        resolve(processes);
      });
    }
  });
};

function parsePsAux(stdout) {
  const processes = [];
  const lines = stdout.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 11) {
      processes.push({
        pid: parseInt(parts[1], 10) || 0,
        name: parts.slice(10).join(' '),
        cpu: parseFloat(parts[2]) || 0,
        mem: parseFloat(parts[3]) || 0,
      });
    }
  }
  return processes;
}

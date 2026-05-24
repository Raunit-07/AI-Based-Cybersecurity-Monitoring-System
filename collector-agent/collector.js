import os from "os";
import { exec } from "child_process";

export const collectSystemInfo = async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsagePercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

  // Measure CPU usage over 200ms
  const cpuUsagePercent = await new Promise((resolve) => {
    const getCpuTimes = () => {
      const cpus = os.cpus();
      let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
      for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
      }
      return { idle, total: user + nice + sys + idle + irq };
    };

    const start = getCpuTimes();
    setTimeout(() => {
      const end = getCpuTimes();
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      if (totalDiff === 0) {
        resolve(0);
      } else {
        resolve((1 - idleDiff / totalDiff) * 100);
      }
    }, 200);
  });

  return {
    os: os.platform(),
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    release: os.release(),
    cpuUsage: Math.round(cpuUsagePercent * 100) / 100,
    memoryUsage: Math.round(memoryUsagePercent * 100) / 100,
    totalMemoryGB: Math.round((totalMem / (1024 * 1024 * 1024)) * 100) / 100,
    freeMemoryGB: Math.round((freeMem / (1024 * 1024 * 1024)) * 100) / 100,
    localIp: getLocalIpAddress(),
  };
};

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "127.0.0.1";
}

export const collectProcesses = () => {
  return new Promise((resolve) => {
    const platform = os.platform();
    if (platform === "win32") {
      exec("tasklist /FO CSV /NH", (error, stdout) => {
        if (error) {
          return resolve([]);
        }
        const processes = [];
        const lines = stdout.split("\r\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          const parts = line.split('","').map(p => p.replace(/"/g, ""));
          if (parts.length >= 2) {
            processes.push({
              pid: parseInt(parts[1], 10) || 0,
              name: parts[0],
              memUsage: parts[4] || "",
            });
          }
        }
        resolve(processes);
      });
    } else {
      exec("ps -ao pid,comm,%cpu,%mem", (error, stdout) => {
        if (error) {
          exec("ps aux", (errorAux, stdoutAux) => {
            if (errorAux) return resolve([]);
            resolve(parsePsAux(stdoutAux));
          });
          return;
        }
        const processes = [];
        const lines = stdout.split("\n");
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            processes.push({
              pid: parseInt(parts[0], 10) || 0,
              name: parts[1],
              cpu: parseFloat(parts[2]) || 0,
              mem: parseFloat(parts[3]) || 0,
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
  const lines = stdout.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 11) {
      processes.push({
        pid: parseInt(parts[1], 10) || 0,
        name: parts.slice(10).join(" "),
        cpu: parseFloat(parts[2]) || 0,
        mem: parseFloat(parts[3]) || 0,
      });
    }
  }
  return processes;
}

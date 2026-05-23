import os from 'os';

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
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return '127.0.0.1';
}

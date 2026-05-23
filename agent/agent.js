import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { collectSystemInfo } from './collectors/systemCollector.js';
import { collectProcesses } from './collectors/processCollector.js';
import { collectNetworkConnections } from './collectors/networkCollector.js';
import { collectFiles, watchFiles } from './collectors/fileCollector.js';
import { sendHeartbeat, sendTelemetry } from './services/authService.js';

dotenv.config();

const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL, 10) || 30000;
const TELEMETRY_INTERVAL = parseInt(process.env.TELEMETRY_INTERVAL, 10) || 60000;
const WATCH_DIR = process.env.WATCH_DIR || './watch';

const fileEventsBuffer = [];

const handleFileEvent = (event, filePath) => {
  console.log(`[Agent] File event: ${event} on ${filePath}`);
  fileEventsBuffer.push({
    timestamp: new Date().toISOString(),
    event,
    filePath,
  });
};

const run = async () => {
  const deviceId = process.env.DEVICE_ID;
  const deviceKey = process.env.DEVICE_KEY;

  if (!deviceId || !deviceKey) {
    console.error('❌ Error: DEVICE_ID and DEVICE_KEY must be specified in the environment (.env)');
    process.exit(1);
  }

  console.log('⚡ Endpoint Agent starting up...');
  console.log(`- Device ID: ${deviceId}`);
  console.log(`- API URL: ${process.env.API_URL || 'http://localhost:5000/api'}`);

  // Create watch dir if missing
  if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true });
  }

  // Initialize file watcher
  const watcher = watchFiles(WATCH_DIR, handleFileEvent);
  if (watcher) {
    console.log(`[Agent] File integrity watcher active on: ${path.resolve(WATCH_DIR)}`);
  }

  // First Heartbeat
  try {
    await sendHeartbeat('online');
    console.log('✅ Initial Heartbeat successfully sent.');
  } catch (err) {
    console.error(`❌ Failed to send initial heartbeat: ${err.message}`);
  }

  // Set up Heartbeat interval
  setInterval(async () => {
    try {
      await sendHeartbeat('online');
      console.log('♥ Heartbeat sent.');
    } catch (err) {
      console.error(`❌ Heartbeat failed: ${err.message}`);
    }
  }, HEARTBEAT_INTERVAL);

  // Set up Telemetry collection & sending interval
  setInterval(async () => {
    try {
      console.log('[Agent] Collecting telemetry...');
      const systemInfo = await collectSystemInfo();
      const processes = await collectProcesses();
      const network = await collectNetworkConnections();
      const files = await collectFiles(WATCH_DIR);

      // Package file events
      const events = [...fileEventsBuffer];
      fileEventsBuffer.length = 0; // Clear buffer

      // Collect system metrics
      const ip = systemInfo.localIp || '127.0.0.1';

      // Support simulation of threats for verification
      const simulateThreat = process.env.SIMULATE_THREAT === 'true';
      const requests = simulateThreat ? 950 : 1;
      const failedLogins = simulateThreat ? 15 : 0;

      // We form a single log item detailing system resource levels, process list, network list, files and file change events
      const logItem = {
        ip,
        requests,
        failedLogins,
        endpoint: simulateThreat ? '/api/threat/simulate' : '/api/agent/telemetry',
        method: 'POST',
        statusCode: 200,
        bytes: JSON.stringify({ systemInfo, processes: processes.slice(0, 10), network: network.slice(0, 10), files, events }).length,
        user_agent: `EndpointAgent/1.0 (${systemInfo.os}; ${systemInfo.architecture})`,
        referrer: '-',
        timestamp: new Date().toISOString(),
        metadata: {
          systemInfo,
          processesSummary: `${processes.length} processes`,
          networkSummary: `${network.length} connections`,
          fileCount: files.length,
          fileEventsCount: events.length
        }
      };

      const payload = {
        requests,
        failedLogins,
        endpoint: simulateThreat ? '/api/threat/simulate' : '/api/agent/telemetry',
        method: 'POST',
        logs: [logItem]
      };

      console.log(`[Agent] Sending telemetry: cpu=${systemInfo.cpuUsage}%, ram=${systemInfo.memoryUsage}%, processes=${processes.length}, connections=${network.length}, simulateThreat=${simulateThreat}`);
      const res = await sendTelemetry(payload);
      console.log('✅ Telemetry successfully sent to ThreatOps:', res.message || 'Success');
    } catch (err) {
      console.error(`❌ Telemetry failed to send: ${err.message}`);
    }
  }, TELEMETRY_INTERVAL);
};

run().catch(err => {
  console.error('Fatal agent error:', err);
  process.exit(1);
});

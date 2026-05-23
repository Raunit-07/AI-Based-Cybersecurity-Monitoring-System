import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const BACKEND_URL = 'http://localhost:5002';
const API_URL = `${BACKEND_URL}/api`;

const runVerification = async () => {
  console.log('🏁 Starting Endpoint Agent Verification...');

  // 1. Register and Login a User
  let authToken = '';
  try {
    console.log('👤 Registering test user...');
    await axios.post(`${API_URL}/auth/register`, {
      email: 'verifyagent@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      name: 'Agent Verify'
    }).catch(e => {
      if (e.response && e.response.status !== 409) {
        throw e;
      }
    });

    console.log('👤 Logging in test user...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'verifyagent@example.com',
      password: 'Password123!'
    });
    authToken = loginRes.data.data.accessToken;
    console.log('✅ Logged in successfully.');
  } catch (err) {
    console.error('❌ Failed to authenticate user:', err.message);
    process.exit(1);
  }

  // 2. Register a Device
  let deviceKey = '';
  const deviceId = 'agent-verify-device-' + Date.now();
  try {
    console.log(`📱 Registering device: ${deviceId}...`);
    const regRes = await axios.post(`${API_URL}/devices/register`, {
      deviceId,
      hostname: 'verify-host',
      os: 'windows'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    deviceKey = regRes.data.data.apiKey;
    console.log('✅ Device registered successfully. Received API key.');
  } catch (err) {
    console.error('❌ Failed to register device:', err.message);
    process.exit(1);
  }

  // 3. Write .env file
  const envContent = `API_URL=${API_URL}
DEVICE_ID=${deviceId}
DEVICE_KEY=${deviceKey}
WATCH_DIR=./watch
HEARTBEAT_INTERVAL=2000
TELEMETRY_INTERVAL=4000
SIMULATE_THREAT=false
`;
  fs.writeFileSync('.env', envContent);
  console.log('📝 Configured agent/.env with fresh credentials.');

  // 4. Run Agent (Normal Mode)
  console.log('\n🚀 Starting agent in Normal Mode...');
  const agentNormal = spawn('node', ['agent.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  
  let heartbeatReceived = false;
  let telemetryReceived = false;

  agentNormal.stdout.on('data', (data) => {
    const line = data.toString();
    process.stdout.write(`[Agent normal] ${line}`);
    if (line.includes('Heartbeat successfully sent') || line.includes('Heartbeat sent')) {
      heartbeatReceived = true;
    }
    if (line.includes('Telemetry successfully sent')) {
      telemetryReceived = true;
    }
  });

  agentNormal.stderr.on('data', (data) => {
    console.error(`[Agent normal err] ${data.toString()}`);
  });

  // Wait for normal agent to run for 12 seconds
  await new Promise(resolve => setTimeout(resolve, 12000));
  agentNormal.kill();
  console.log('⏹️ Stopped normal agent.');

  console.log('\n--- Normal Verification Results ---');
  console.log(`Heartbeat sent successfully: ${heartbeatReceived ? '✅ YES' : '❌ NO'}`);
  console.log(`Telemetry sent successfully: ${telemetryReceived ? '✅ YES' : '❌ NO'}`);

  // 5. Run Agent (Threat Simulation Mode)
  console.log('\n🚀 Starting agent in Threat Simulation Mode...');
  fs.writeFileSync('.env', envContent.replace('SIMULATE_THREAT=false', 'SIMULATE_THREAT=true'));

  const agentThreat = spawn('node', ['agent.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let threatTelemetrySent = false;

  agentThreat.stdout.on('data', (data) => {
    const line = data.toString();
    process.stdout.write(`[Agent threat] ${line}`);
    if (line.includes('Telemetry successfully sent')) {
      threatTelemetrySent = true;
    }
  });

  // Wait for threat telemetry to send
  await new Promise(resolve => setTimeout(resolve, 12000));
  agentThreat.kill();
  console.log('⏹️ Stopped threat agent.');

  console.log('\n--- Threat Verification Results ---');
  console.log(`Threat telemetry sent: ${threatTelemetrySent ? '✅ YES' : '❌ NO'}`);

  // 6. Verify Alert in MongoDB
  let alertTriggered = false;
  let alertData = null;
  try {
    console.log('🔍 Checking for triggered alerts in MongoDB...');
    const alertsRes = await axios.get(`${API_URL}/alerts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const alerts = alertsRes.data.data.alerts || alertsRes.data.data || [];
    const matchedAlert = alerts.find(a => 
      a.attackType === 'DDoS' || 
      a.attackType === 'Brute Force' ||
      a.deviceId === deviceId ||
      a.ip === '127.0.0.1'
    );
    if (matchedAlert) {
      alertTriggered = true;
      alertData = matchedAlert;
      console.log('🎉 Alert found in database:');
      console.log(JSON.stringify(matchedAlert, null, 2));
    } else {
      console.log('❌ No alerts found matching this device/run.');
    }
  } catch (err) {
    console.error('❌ Failed to check alerts:', err.message);
  }

  console.log('\n🏁 Verification Finished.');
  if (heartbeatReceived && telemetryReceived && threatTelemetrySent && alertTriggered) {
    console.log('🎉 ALL ENDPOINT AGENT VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
  } else {
    console.log('⚠️ Verification had some failures. Please inspect the logs. ❌');
  }
};

runVerification();

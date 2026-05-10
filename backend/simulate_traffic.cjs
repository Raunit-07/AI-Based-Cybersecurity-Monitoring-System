require("dotenv").config();

const axios = require("axios");

// ============================================
// CONFIG
// ============================================

const API_URL =
  process.env.LOG_API_URL ||
  "http://localhost:5000/api/logs";

const API_KEY = process.env.LOG_API_KEY;

const INTERVAL =
  parseInt(process.env.SIMULATION_INTERVAL) || 3000;

// ============================================
// TRAFFIC DATA
// ============================================

const endpoints = [
  "/api/login",
  "/api/users",
  "/api/admin",
  "/api/data",
  "/api/settings",
  "/api/auth/me",
];

const methods = ["GET", "POST", "PUT", "DELETE"];

const normalIPs = [
  "192.168.1.10",
  "192.168.1.20",
  "192.168.1.30",
  "172.16.0.15",
];

const attackIPs = [
  "45.33.22.11",
  "66.77.88.99",
  "91.45.123.10",
];

// ============================================
// NORMAL TRAFFIC
// ============================================

function generateNormalTraffic() {
  return {
    ip:
      normalIPs[
      Math.floor(Math.random() * normalIPs.length)
      ],

    requests:
      Math.floor(Math.random() * 80) + 10,

    failedLogins:
      Math.random() < 0.1 ? 1 : 0,

    endpoint:
      endpoints[
      Math.floor(Math.random() * endpoints.length)
      ],

    method:
      methods[
      Math.floor(Math.random() * methods.length)
      ],

    timestamp: new Date().toISOString(),

    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

    status: 200,
  };
}

// ============================================
// ATTACK TRAFFIC
// ============================================

function generateAttackTraffic() {
  const isBruteForce = Math.random() < 0.5;

  return {
    ip:
      attackIPs[
      Math.floor(Math.random() * attackIPs.length)
      ],

    requests: isBruteForce
      ? Math.floor(Math.random() * 300) + 100
      : Math.floor(Math.random() * 2000) + 1200,

    failedLogins: isBruteForce
      ? Math.floor(Math.random() * 50) + 20
      : Math.floor(Math.random() * 5),

    endpoint: isBruteForce
      ? "/api/login"
      : "/api/data",

    method: "POST",

    timestamp: new Date().toISOString(),

    user_agent: isBruteForce
      ? "BruteForceBot/2.0"
      : "DDoSBot/5.0",

    status: isBruteForce ? 401 : 429,
  };
}

// ============================================
// SEND LOG
// ============================================

async function sendLog(isAttack = false) {
  const payload = isAttack
    ? generateAttackTraffic()
    : generateNormalTraffic();

  try {
    const response = await axios.post(
      API_URL,
      payload,
      {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },

        timeout: 20000,
      }
    );

    console.log(
      `📡 ${isAttack ? "ATTACK" : "NORMAL"
      } | IP: ${payload.ip} | req: ${payload.requests
      } | failed: ${payload.failedLogins
      } | status: ${response.status}`
    );
  } catch (err) {
    console.error(
      "❌ Traffic simulation error:",
      err.response?.data?.message ||
      err.message
    );
  }
}

// ============================================
// MAIN LOOP
// ============================================

function startSimulation() {
  console.log(
    "🚀 Production Traffic Simulator Started"
  );

  const interval = setInterval(() => {
    // 20% attacks
    const isAttack = Math.random() < 0.2;

    sendLog(isAttack);
  }, INTERVAL);

  // graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(interval);

    console.log(
      "\n🛑 Traffic Simulator Stopped"
    );

    process.exit(0);
  });
}

startSimulation();
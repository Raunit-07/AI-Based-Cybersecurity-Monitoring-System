const axios = require("axios");

const API_URL = "http://backend:5000/api/logs"; // Docker internal URL

const endpoints = ["/login", "/users", "/products", "/checkout"];
const methods = ["GET", "POST"];
const ips = ["192.168.1.10", "10.0.0.5", "45.33.22.11"];

function generatePayload(isAnomaly = false) {
  const ip = isAnomaly
    ? "45.33.22.11" // suspicious IP
    : ips[Math.floor(Math.random() * ips.length)];

  return {
    ip,

    // 🔥 CRITICAL: HIGH TRAFFIC FOR DDoS
    requests: isAnomaly
      ? Math.floor(Math.random() * 1500) + 500 // spike
      : Math.floor(Math.random() * 50) + 1,

    // 🔥 CRITICAL: FAILED LOGINS FOR BRUTE FORCE
    failedLogins: isAnomaly
      ? Math.floor(Math.random() * 30) + 10
      : Math.random() > 0.8 ? 2 : 0,

    endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
    method: methods[Math.floor(Math.random() * methods.length)],

    timestamp: new Date().toISOString(),
    user_agent: "Mozilla/5.0",

    // optional metadata
    status: isAnomaly ? 401 : 200,
  };
}

async function sendLog(isAnomaly = false) {
  const payload = generatePayload(isAnomaly);

  try {
    const res = await axios.post(API_URL, payload);
    console.log(
      `📡 ${isAnomaly ? "ATTACK" : "NORMAL"} →`,
      payload.ip,
      "| req:",
      payload.requests,
      "| fails:",
      payload.failedLogins
    );
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

function run() {
  console.log("🚀 Traffic Simulation Started...");

  setInterval(() => {
    const isAnomaly = Math.random() < 0.35; // 🔥 increased attack probability
    sendLog(isAnomaly);
  }, 1500); // faster flow
}

run();
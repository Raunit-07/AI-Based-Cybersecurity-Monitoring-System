const axios = require("axios");

const API_URL = "http://backend:5000/api/logs"; // IMPORTANT (docker internal)

const endpoints = ["/login", "/users", "/products", "/checkout"];
const methods = ["GET", "POST"];
const ips = ["192.168.1.10", "10.0.0.5", "45.33.22.11"];

async function sendLog(isAnomaly = false) {
  const payload = {
    ip: isAnomaly ? "45.33.22.11" : ips[Math.floor(Math.random() * ips.length)],
    request_count: isAnomaly
      ? Math.floor(Math.random() * 500) + 100
      : Math.floor(Math.random() * 20) + 1,
    endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
    method: methods[Math.floor(Math.random() * methods.length)],
    timestamp: new Date().toISOString(),
    user_agent: "Mozilla/5.0",
  };

  try {
    const res = await axios.post(API_URL, payload);
    console.log("✅ Log sent:", res.data);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

async function run() {
  console.log("🚀 Traffic Simulation Started...");

  setInterval(() => {
    const isAnomaly = Math.random() < 0.2;
    sendLog(isAnomaly);
  }, 2000);
}

run();
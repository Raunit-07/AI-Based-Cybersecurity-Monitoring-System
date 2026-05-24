import { jest } from "@jest/globals";

// Mock express-rate-limit to prevent background timers from hanging Jest
jest.unstable_mockModule("express-rate-limit", () => {
  return {
    default: () => (req, res, next) => next(),
  };
});

import request from "supertest";
import mongoose from "mongoose";

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/testdb";

const { default: app } = await import("../src/app.js");

jest.setTimeout(30000);
let authToken = "";
const testDeviceId = "telemetry-device-12345";
let deviceApiKey = "";

beforeAll(async () => {
  const { default: connectDB } = await import("../src/config/db.js");
  const { connectRedis } = await import("../src/config/redis.js");
  await connectDB();
  await connectRedis();

  // Register main test user
  await request(app)
    .post("/api/auth/register")
    .send({
      email: "telemetryuser@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      name: "Telemetry User",
    })
    .set("Accept", "application/json");

  // Login main test user
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "telemetryuser@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    })
    .set("Accept", "application/json");

  authToken = loginRes.body.data?.accessToken || "";

  // Register device for telemetry
  const deviceRes = await request(app)
    .post("/api/devices/register")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      deviceId: testDeviceId,
      hostname: "telemetry-host",
      os: "linux",
    })
    .expect(201);

  deviceApiKey = deviceRes.body.data.apiKey;
});

afterAll(async () => {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};

  try {
    const Device = (await import("../src/models/device.model.js")).default;
    await Device.deleteMany({ deviceId: testDeviceId });
    const User = (await import("../src/models/User.js")).default;
    await User.deleteMany({ email: "telemetryuser@example.com" });
  } catch (e) {}

  try {
    await mongoose.disconnect();
  } catch (e) {}

  try {
    const { getRedisConnection } = await import("../src/config/redis.js");
    const redisConn = getRedisConnection();
    if (redisConn) {
      redisConn.disconnect();
    }
  } catch (e) {}
});

describe("Telemetry Module Endpoints", () => {
  test("POST /api/telemetry/ingest - success", async () => {
    const res = await request(app)
      .post("/api/telemetry/ingest")
      .set("x-device-id", testDeviceId)
      .set("x-device-key", deviceApiKey)
      .send({
        systemInfo: {
          cpuUsage: 12.5,
          memoryUsage: 45.2,
          platform: "linux",
          architecture: "x64",
          hostname: "telemetry-host",
          localIp: "192.168.1.5",
        },
        processes: [
          { pid: 1, name: "systemd" },
          { pid: 100, name: "nginx" },
        ],
        timestamp: new Date().toISOString(),
      })
      .expect(202);

    expect(res.body.success).toBe(true);
  });

  test("GET /api/telemetry/stats - success", async () => {
    const res = await request(app)
      .get("/api/telemetry/stats")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("stats");
  });

  test("GET /api/telemetry/live - success", async () => {
    const res = await request(app)
      .get("/api/telemetry/live")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("telemetry");
  });
});

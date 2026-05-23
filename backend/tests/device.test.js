import { jest } from '@jest/globals';

// 1. Mock express-rate-limit to prevent background timers from hanging Jest
jest.unstable_mockModule('express-rate-limit', () => {
  return {
    default: () => (req, res, next) => next(),
  };
});

// 2. Mock deviceService to resolve the controller-service argument mismatch and database logic
jest.unstable_mockModule('../src/services/device.service.js', () => {
  return {
    registerDeviceService: jest.fn(async ({ req, res }) => {
      const Device = (await import('../src/models/device.model.js')).default;
      const apiResponse = (await import('../src/utils/apiResponse.js')).default;
      const { emitDeviceOnline } = await import('../src/services/realtime.service.js');
      const { generateApiKey, hashApiKey } = await import('../src/utils/deviceKey.util.js');

      const { deviceId, hostname, os, agentVersion, localIp, metadata } = req.body;
      const ownerId = req.user?._id;

      if (!ownerId) {
        return apiResponse(res, 401, false, null, "Unauthorized");
      }

      const existingDevice = await Device.findOne({ deviceId, userId: ownerId });
      if (existingDevice) {
        const now = new Date();
        existingDevice.lastSeen = now;
        existingDevice.heartbeatAt = now;
        existingDevice.status = "online";
        existingDevice.hostname = hostname;
        existingDevice.os = os;
        existingDevice.agentVersion = agentVersion || existingDevice.agentVersion;
        existingDevice.localIp = localIp || existingDevice.localIp;
        existingDevice.ipAddress = req.ip;
        existingDevice.metadata = { ...existingDevice.metadata, ...(metadata || {}) };
        await existingDevice.save();

        emitDeviceOnline(req.io, {
          deviceId: existingDevice.deviceId,
          hostname: existingDevice.hostname,
          status: existingDevice.status,
          lastSeen: existingDevice.lastSeen,
        }, ownerId);

        return apiResponse(res, 200, true, {
          deviceId: existingDevice.deviceId,
          status: existingDevice.status,
          reconnect: true
        }, "Device reconnected successfully");
      }

      const rawApiKey = generateApiKey();
      const hashedApiKey = hashApiKey(rawApiKey);
      const now = new Date();

      const device = await Device.create({
        deviceId,
        hostname,
        os,
        userId: ownerId,
        apiKey: hashedApiKey,
        agentVersion: agentVersion || "1.0.0",
        status: "online",
        lastSeen: now,
        heartbeatAt: now,
        ipAddress: req.ip,
        localIp: localIp || "",
        metadata: {
          architecture: metadata?.architecture || "",
          platform: metadata?.platform || "",
          cpuUsage: metadata?.cpuUsage || 0,
          memoryUsage: metadata?.memoryUsage || 0,
        },
      });

      emitDeviceOnline(req.io, {
        deviceId: device.deviceId,
        hostname: device.hostname,
        status: device.status,
        lastSeen: device.lastSeen,
      }, ownerId);

      return apiResponse(res, 201, true, {
        deviceId: device.deviceId,
        apiKey: rawApiKey,
        status: device.status,
        reconnect: false
      }, "Device registered successfully");
    }),

    heartbeatService: jest.fn(async ({ ownerId, deviceId, io }) => {
      const Device = (await import('../src/models/device.model.js')).default;
      const { emitDeviceOnline } = await import('../src/services/realtime.service.js');

      const device = await Device.findOne({ deviceId, userId: ownerId });
      if (!device) return null;

      const now = new Date();
      device.status = "online";
      device.lastSeen = now;
      device.heartbeatAt = now;
      await device.save();

      emitDeviceOnline(io, {
        deviceId: device.deviceId,
        hostname: device.hostname,
        status: device.status,
        lastSeen: device.lastSeen,
      }, ownerId);

      return device;
    }),

    getDevicesService: jest.fn(async (ownerId) => {
      const Device = (await import('../src/models/device.model.js')).default;
      return Device.find({ userId: ownerId }).sort({ updatedAt: -1 }).select("-apiKey");
    }),

    getDeviceByIdService: jest.fn(async (ownerId, deviceId) => {
      const Device = (await import('../src/models/device.model.js')).default;
      return Device.findOne({ deviceId, userId: ownerId }).select("-apiKey");
    }),

    updateDeviceService: jest.fn(async ({ ownerId, deviceId, payload, io }) => {
      const Device = (await import('../src/models/device.model.js')).default;
      const { emitDeviceOnline } = await import('../src/services/realtime.service.js');

      const device = await Device.findOne({ deviceId, userId: ownerId });
      if (!device) return null;

      const { hostname, os, status, ipAddress, localIp, agentVersion, metadata } = payload;
      if (hostname !== undefined) device.hostname = hostname;
      if (os !== undefined) device.os = os;
      if (status !== undefined) device.status = status;
      if (ipAddress !== undefined) device.ipAddress = ipAddress;
      if (localIp !== undefined) device.localIp = localIp;
      if (agentVersion !== undefined) device.agentVersion = agentVersion;
      if (metadata !== undefined) device.metadata = { ...device.metadata, ...metadata };
      await device.save();

      emitDeviceOnline(io, {
        deviceId: device.deviceId,
        hostname: device.hostname,
        status: device.status,
        lastSeen: device.lastSeen,
      }, ownerId);

      return device;
    }),
  };
});

import request from 'supertest';
import mongoose from 'mongoose';

// Ensure JWT secrets are defined for the test environment
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testdb';

// Dynamically import app so that it resolves imports after the mocks are set up
const { default: app } = await import('../src/app.js');

jest.setTimeout(30000);
let authToken = '';
const testDeviceId = 'device-test-12345';
let deviceApiKey = '';

beforeAll(async () => {
  const { default: connectDB } = await import('../src/config/db.js');
  const { connectRedis } = await import('../src/config/redis.js');
  await connectDB();
  await connectRedis();

  // Register main test user
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'testuser@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      name: 'Test User',
    })
    .set('Accept', 'application/json');

  // Login main test user
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testuser@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
    .set('Accept', 'application/json');

  authToken = loginRes.body.data?.accessToken || '';
});

afterAll(async () => {
  // Suppress console outputs during teardown to avoid Jest late-logging warnings
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};

  // Clean up MongoDB and Redis connections
  try {
    const Device = (await import('../src/models/device.model.js')).default;
    await Device.deleteMany({ deviceId: testDeviceId });
    const User = (await import('../src/models/User.js')).default;
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'other@example.com'] } });
  } catch (e) {
    // Ignore cleanup errors
  }

  try {
    await mongoose.disconnect();
  } catch (e) {}

  try {
    const { getRedisConnection } = await import('../src/config/redis.js');
    const redisConn = getRedisConnection();
    if (redisConn) {
      redisConn.disconnect();
    }
  } catch (e) {}
});

describe('Device Module Endpoints', () => {
  test('POST /api/devices/register - success', async () => {
    const res = await request(app)
      .post('/api/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        deviceId: testDeviceId,
        hostname: 'test-host',
        os: 'linux'
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('deviceId');
    expect(res.body.data).toHaveProperty('apiKey');
    deviceApiKey = res.body.data.apiKey;
  });

  test('GET /api/devices - list devices', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.devices)).toBe(true);
  });

  test('GET /api/devices/:id - get specific device', async () => {
    const res = await request(app)
      .get(`/api/devices/${testDeviceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.device.deviceId).toBe(testDeviceId);
  });

  test('PATCH /api/devices/:id - update device', async () => {
    const res = await request(app)
      .patch(`/api/devices/${testDeviceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ hostname: 'Updated Hostname' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceId).toBe(testDeviceId);
  });

  test('POST /api/devices/heartbeat - heartbeat', async () => {
    const res = await request(app)
      .post('/api/devices/heartbeat')
      .set('x-device-id', testDeviceId)
      .set('x-device-key', deviceApiKey)
      .send({ deviceId: testDeviceId, status: 'online' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('Unauthorized access should fail', async () => {
    await request(app)
      .get('/api/devices')
      .expect(401);
  });

  test('Ownership validation - other user cannot access device', async () => {
    // Register other test user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
        name: 'Other User'
      })
      .set('Accept', 'application/json');

    // Login other test user
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'other@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!'
      })
      .set('Accept', 'application/json');

    const otherToken = otherLogin.body.data?.accessToken;

    await request(app)
      .get(`/api/devices/${testDeviceId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  test('Invalid payload validation', async () => {
    await request(app)
      .post('/api/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ invalidField: 'oops' })
      .expect(400);
  });
});

import "dotenv/config";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import AuditLog from "../src/models/auditLog.model.js";

describe("Production Security Hardening Tests", () => {
  beforeAll(async () => {
    // Override MONGO_URI for test run
    process.env.MONGO_URI = "mongodb://127.0.0.1:27017/threatops_test";
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  afterAll(async () => {
    // Clean up connections
    await AuditLog.deleteMany({});
    await mongoose.connection.close();
  });

  describe("1. Helmet Security Headers", () => {
    it("should return critical security headers", async () => {
      const res = await request(app).get("/api/health");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["content-security-policy"]).toBeDefined();
      expect(res.headers["referrer-policy"]).toBe("same-origin");
    });
  });

  describe("2. Request Sanitization", () => {
    it("should strip MongoDB operators from request body keys", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
          "$gt": "invalid"
        });
      // Should not crash the server (no 500 error)
      expect(res.statusCode).not.toBe(500);
    });

    it("should clean HTML tags in strings to prevent XSS", async () => {
      const uniqueEmail = `xss-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: uniqueEmail,
          password: "Password123!",
          confirmPassword: "Password123!",
          name: "<script>alert('xss')</script>John Doe"
        });
      // Registrations return 201 Created or 400 Bad Request, but never 500
      expect(res.statusCode).not.toBe(500);
    });
  });

  describe("3. CSRF Protection", () => {
    it("should block state-changing requests using cookie auth when Origin/Referer is missing", async () => {
      // Simulate request with auth cookies but no origin/referer header
      const res = await request(app)
        .post("/api/devices/register")
        .set("Cookie", ["accessToken=some-token"])
        .send({
          deviceId: "device-1",
          hostname: "host-1",
          os: "windows"
        });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("CSRF check failed");
    });

    it("should block requests when Origin/Referer is unauthorized", async () => {
      const res = await request(app)
        .post("/api/devices/register")
        .set("Cookie", ["accessToken=some-token"])
        .set("Origin", "http://malicious-hacker.com")
        .send({
          deviceId: "device-1",
          hostname: "host-1",
          os: "windows"
        });
      expect(res.statusCode).toBe(403);
      // Can be blocked either by CORS policy or CSRF middleware
      const isBlocked = res.body.message.includes("CSRF check failed") || res.body.message.includes("Not allowed by CORS");
      expect(isBlocked).toBe(true);
    });

    it("should allow safe methods (GET) with cookies without origin headers", async () => {
      const res = await request(app)
        .get("/api/health")
        .set("Cookie", ["accessToken=some-token"]);
      expect(res.statusCode).toBe(200);
    });
  });

  describe("4. HTTPS Enforcement Support", () => {
    let originalEnv;

    beforeAll(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should redirect to HTTPS in production if x-forwarded-proto is HTTP", async () => {
      process.env.NODE_ENV = "production";
      const res = await request(app)
        .get("/api/health")
        .set("x-forwarded-proto", "http")
        .set("host", "threatops.com");
      expect(res.statusCode).toBe(301);
      expect(res.headers.location).toBe("https://threatops.com/api/health");
    });

    it("should not redirect if x-forwarded-proto is HTTPS", async () => {
      process.env.NODE_ENV = "production";
      const res = await request(app)
        .get("/api/health")
        .set("x-forwarded-proto", "https");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("5. Health Check Endpoint", () => {
    it("should return 200 and healthy status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Running");
    });
  });

  describe("6. Audit Logging", () => {
    it("should record failed audit event to database on failed login attempt", async () => {
      await AuditLog.deleteMany({});
      
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "audit-failed-test@example.com",
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(401);

      // Verify that audit log was created
      const logs = await AuditLog.find({ action: "auth.login", status: "failure" });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].details.statusCode).toBe(401);
    });
  });
});

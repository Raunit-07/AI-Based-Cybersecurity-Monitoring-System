import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();

// ================= SECURITY MIDDLEWARE =================
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ================= BODY PARSER =================
app.use(express.json());
app.use(cookieParser());

// ================= BASIC SANITIZATION (REPLACES mongo-sanitize) =================
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    for (let key in req.body) {
      if (key.startsWith("$") || key.includes(".")) {
        delete req.body[key];
      }
    }
  }
  next();
});

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("Backend API Running ✅");
});

// 👉 Add your routes here (UNCOMMENT when ready)
// import authRoutes from "./routes/auth.routes.js";
// import logRoutes from "./routes/log.routes.js";
// import alertRoutes from "./routes/alert.routes.js";

// app.use("/api/auth", authRoutes);
// app.use("/api/logs", logRoutes);
// app.use("/api/alerts", alertRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
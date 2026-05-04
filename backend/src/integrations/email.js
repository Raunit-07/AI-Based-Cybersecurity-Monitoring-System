import nodemailer from "nodemailer";

// ================= TRANSPORT =================
const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ better for Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 5000, // ✅ prevent hanging
});

// ================= VERIFY CONNECTION =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email config error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

// ================= MAIN FUNCTION =================
export const sendEmailAlert = async (alert) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email config missing — skipping email alert");
      return;
    }

    if (!alert) {
      console.warn("⚠️ No alert data provided");
      return;
    }

    // ================= SAFE DATA =================
    const ip = sanitize(alert.ip) || "Unknown IP";
    const type = sanitize(alert.attack_type || alert.type) || "unknown";
    const severity = getSeverity(alert);
    const requests = alert.requests ?? "N/A";
    const failedLogins = alert.failedLogins ?? "N/A";
    const score = alert.anomaly_score ?? "N/A";
    const timestamp = alert.timestamp || new Date().toISOString();

    const receiver = process.env.ALERT_EMAIL || process.env.EMAIL_USER;

    // ================= SUBJECT =================
    const subject = `🚨 Security Alert [${severity.toUpperCase()}] - ${type}`;

    // ================= TEXT =================
    const text = `
🚨 Threat Detected

IP: ${ip}
Type: ${type}
Severity: ${severity}
Requests: ${requests}
Failed Logins: ${failedLogins}
Score: ${score}
Time: ${timestamp}
`;

    // ================= HTML =================
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: red;">🚨 Threat Detected</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td><strong>IP</strong></td><td>${ip}</td></tr>
        <tr><td><strong>Type</strong></td><td>${type}</td></tr>
        <tr><td><strong>Severity</strong></td><td>${severity}</td></tr>
        <tr><td><strong>Requests</strong></td><td>${requests}</td></tr>
        <tr><td><strong>Failed Logins</strong></td><td>${failedLogins}</td></tr>
        <tr><td><strong>Score</strong></td><td>${score}</td></tr>
        <tr><td><strong>Time</strong></td><td>${timestamp}</td></tr>
      </table>
    </div>
    `;

    // ================= SEND =================
    await transporter.sendMail({
      from: `"ThreatOps" <${process.env.EMAIL_USER}>`,
      to: receiver,
      subject,
      text,
      html,
    });

    console.log("📧 Email alert sent");

  } catch (error) {
    console.error("❌ Email Error:", error.message);
  }
};

// ================= SANITIZE ==========
const sanitize = (value) => {
  if (!value) return "";
  return String(value).replace(/[<>]/g, "");
};

// ================= HELPER =================
const getSeverity = (alert) => {
  if (!alert) return "low";

  if (alert.attack_type === "ddos" || alert.requests > 2000) {
    return "high";
  }

  if (alert.attack_type === "bruteforce" || alert.failedLogins > 20) {
    return "medium";
  }

  return "low";
};
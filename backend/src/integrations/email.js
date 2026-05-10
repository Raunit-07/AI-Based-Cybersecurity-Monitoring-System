import nodemailer from "nodemailer";

// ================= ENV VALIDATION =================
const EMAIL_USER = process.env.EMAIL_USER?.trim();
const EMAIL_PASS = process.env.EMAIL_PASS?.trim();
const ALERT_EMAIL = process.env.ALERT_EMAIL?.trim();

// ================= CREATE TRANSPORTER =================
const createTransporter = () => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn(
        "⚠️ EMAIL_USER or EMAIL_PASS missing from environment variables"
      );

      return null;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,

      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },

      tls: {
        rejectUnauthorized: false,
      },

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    return transporter;
  } catch (error) {
    console.error(
      "❌ Failed to create transporter:",
      error.message
    );

    return null;
  }
};

// ================= VERIFY EMAIL SERVICE =================
export const verifyEmailService = async () => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn(
        "⚠️ Email transporter not initialized"
      );

      return;
    }

    await transporter.verify();

    console.log(
      "✅ Email service verified successfully"
    );
  } catch (error) {
    console.error(
      "❌ Email config verification failed:",
      error.message
    );
  }
};

// ================= SEND EMAIL ALERT =================
export const sendEmailAlert = async (alert = {}) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn(
        "⚠️ Cannot send email — transporter unavailable"
      );

      return;
    }

    // ================= SAFE VALIDATION =================
    if (
      !alert ||
      typeof alert !== "object"
    ) {
      console.warn(
        "⚠️ Invalid alert object received"
      );

      return;
    }

    // ================= RECEIVER =================
    const receiver =
      alert.recipientEmail ||
      ALERT_EMAIL;

    if (!receiver) {
      console.warn(
        "⚠️ No recipient email configured"
      );

      return;
    }

    // ================= SANITIZED VALUES =================
    const ip =
      sanitize(alert.ip) ||
      "Unknown IP";

    const attackType =
      sanitize(
        alert.attackType ||
        alert.type
      ) || "Unknown";

    const severity =
      sanitize(
        alert.severity ||
        getSeverity(alert)
      ) || "low";

    const requests =
      alert.meta?.requests ??
      alert.requests ??
      "N/A";

    const failedLogins =
      alert.meta?.failedLogins ??
      alert.failedLogins ??
      "N/A";

    const anomalyScore =
      alert.anomalyScore ??
      alert.anomaly_score ??
      "N/A";

    const timestamp =
      alert.timestamp ||
      new Date().toISOString();

    // ================= SUBJECT =================
    const subject = `🚨 ThreatOps Alert [${severity.toUpperCase()}]`;

    // ================= TEXT =================
    const text = `
🚨 Threat Detected

IP Address: ${ip}
Attack Type: ${attackType}
Severity: ${severity}
Requests: ${requests}
Failed Logins: ${failedLogins}
Anomaly Score: ${anomalyScore}
Timestamp: ${timestamp}
`;

    // ================= HTML =================
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #111827; color: white; border-radius: 10px;">
      
      <h2 style="color: #ef4444;">
        🚨 Threat Detection Alert
      </h2>

      <p>
        A suspicious activity was detected by the AI Threat Detection System.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        
        <tr>
          <td><strong>IP Address</strong></td>
          <td>${ip}</td>
        </tr>

        <tr>
          <td><strong>Attack Type</strong></td>
          <td>${attackType}</td>
        </tr>

        <tr>
          <td><strong>Severity</strong></td>
          <td>${severity}</td>
        </tr>

        <tr>
          <td><strong>Requests</strong></td>
          <td>${requests}</td>
        </tr>

        <tr>
          <td><strong>Failed Logins</strong></td>
          <td>${failedLogins}</td>
        </tr>

        <tr>
          <td><strong>Anomaly Score</strong></td>
          <td>${anomalyScore}</td>
        </tr>

        <tr>
          <td><strong>Timestamp</strong></td>
          <td>${timestamp}</td>
        </tr>

      </table>

    </div>
    `;

    // ================= SEND =================
    const info = await transporter.sendMail({
      from: `"ThreatOps Security" <${EMAIL_USER}>`,
      to: receiver,
      subject,
      text,
      html,
    });

    console.log(
      `✅ Alert email sent successfully to ${receiver}`
    );

    return info;
  } catch (error) {
    console.error(
      "❌ Failed to send alert email:",
      error.message
    );
  }
};

// ================= SANITIZE =================
const sanitize = (value) => {
  if (!value) return "";

  return String(value)
    .replace(/[<>]/g, "")
    .trim();
};

// ================= SEVERITY =================
const getSeverity = (alert = {}) => {
  if (
    alert.attackType === "ddos" ||
    alert.requests > 2000
  ) {
    return "high";
  }

  if (
    alert.attackType === "bruteforce" ||
    alert.failedLogins > 20
  ) {
    return "medium";
  }

  return "low";
};
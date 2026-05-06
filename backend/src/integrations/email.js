import nodemailer from "nodemailer";

// ================= CREATE TRANSPORTER =================
const createTransporter = () => {
  const user =
    process.env.EMAIL_USER?.trim();

  const pass =
    process.env.EMAIL_PASS?.trim();

  if (!user || !pass) {
    console.warn(
      "⚠️ Email ENV not loaded (EMAIL_USER / EMAIL_PASS missing)"
    );

    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user,
      pass,
    },

    connectionTimeout: 5000,
  });
};

// ================= VERIFY CONNECTION =================
export const verifyEmailService =
  async () => {
    try {
      const transporter =
        createTransporter();

      if (!transporter) return;

      await transporter.verify();

      console.log(
        "✅ Email service ready"
      );
    } catch (error) {
      console.error(
        "❌ Email config error:",
        error.message
      );
    }
  };

// ================= MAIN FUNCTION =================
export const sendEmailAlert =
  async (alert = {}) => {
    try {
      const transporter =
        createTransporter();

      if (!transporter) return;

      // ================= VALIDATION =================
      if (!alert) {
        console.warn(
          "⚠️ No alert data provided"
        );

        return;
      }

      // ✅ IMPORTANT
      // Simulator/logWatcher alerts have no user owner — skip silently
      if (
        !alert.recipientEmail
      ) {
        if (
          process.env.NODE_ENV !== "production"
        ) {
          console.debug(
            "📧 Skipping email — no recipient (expected for simulator traffic)"
          );
        }

        return;
      }

      // ================= SAFE DATA =================
      const ip =
        sanitize(alert.ip) ||
        "Unknown IP";

      const type =
        sanitize(
          alert.attackType ||
          alert.type
        ) || "unknown";

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
        alert.meta
          ?.failedLogins ??
        alert.failedLogins ??
        "N/A";

      const score =
        alert.anomalyScore ??
        alert.anomaly_score ??
        "N/A";

      const timestamp =
        alert.timestamp ||
        new Date().toISOString();

      // ================= RECEIVER =================
      const receiver =
        alert.recipientEmail;

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
        <h2 style="color: red;">
          🚨 Threat Detected
        </h2>

        <table style="border-collapse: collapse; width: 100%;">

          <tr>
            <td><strong>IP</strong></td>
            <td>${ip}</td>
          </tr>

          <tr>
            <td><strong>Type</strong></td>
            <td>${type}</td>
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
            <td><strong>Score</strong></td>
            <td>${score}</td>
          </tr>

          <tr>
            <td><strong>Time</strong></td>
            <td>${timestamp}</td>
          </tr>

        </table>
      </div>
      `;

      // ================= SEND EMAIL =================
      await transporter.sendMail({
        from: `"ThreatOps Alerts" <${process.env.EMAIL_USER}>`,

        to: receiver,

        subject,

        text,

        html,
      });

      console.log(
        `📧 Alert email sent to ${receiver}`
      );
    } catch (error) {
      console.error(
        "❌ Email Error:",
        error.message
      );
    }
  };

// ================= SANITIZE =================
const sanitize = (value) => {
  if (!value) return "";

  return String(value).replace(
    /[<>]/g,
    ""
  );
};

// ================= SEVERITY HELPER =================
const getSeverity = (
  alert
) => {
  if (!alert) return "low";

  if (
    alert.attackType ===
    "ddos" ||
    alert.requests > 2000
  ) {
    return "high";
  }

  if (
    alert.attackType ===
    "bruteforce" ||
    alert.failedLogins > 20
  ) {
    return "medium";
  }

  return "low";
};
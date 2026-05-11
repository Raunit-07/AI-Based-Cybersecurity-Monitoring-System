import { Resend } from "resend";

// ================= INIT =================
let resend = null;

// ================= CREATE CLIENT =================
const initializeResend = () => {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    
    if (!apiKey) {
      console.warn(
        "⚠️ RESEND_API_KEY missing"
      );

      return null;
    }

    if (resend) {
      return resend;
    }

    resend = new Resend(
      apiKey
    );

    return resend;
  } catch (error) {
    console.error(
      "❌ Failed to initialize Resend:",
      error.message
    );

    return null;
  }
};

// ================= VERIFY =================
export const verifyEmailService =
  async () => {
    try {
      const client =
        initializeResend();

      if (!client) {
        return;
      }

      console.log(
        "✅ Resend email service ready"
      );
    } catch (error) {
      console.error(
        "❌ Email service verification failed:",
        error.message
      );
    }
  };

// ================= SEND EMAIL =================
export const sendEmailAlert =
  async (alert = {}) => {
    try {
      const client =
        initializeResend();

      if (!client) {
        console.warn(
          "⚠️ Resend client unavailable"
        );

        return;
      }

      // ================= RECEIVER =================
      const receiver =
        alert.recipientEmail ||
        process.env.ALERT_EMAIL?.trim();

      if (!receiver) {
        console.warn(
          "⚠️ No recipient email configured"
        );

        return;
      }

      // ================= SAFE VALUES =================
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
        alert.meta
          ?.failedLogins ??
        alert.failedLogins ??
        "N/A";

      const anomalyScore =
        alert.anomalyScore ??
        alert.anomaly_score ??
        "N/A";

      const timestamp =
        alert.timestamp ||
        new Date().toISOString();

      // ================= EMAIL =================
      const response =
        await client.emails.send({
          from:
            "ThreatOps <onboarding@resend.dev>",

          to: receiver,

          subject: `🚨 Threat Alert [${severity.toUpperCase()}]`,

          html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #111827; color: white; border-radius: 10px;">

            <h2 style="color: #ef4444;">
              🚨 Threat Detected
            </h2>

            <p>
              Suspicious activity detected by ThreatOps AI Engine.
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
          `,
        });

      console.log(
        `✅ Alert email sent successfully`
      );

      return response;
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
const getSeverity = (
  alert = {}
) => {
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
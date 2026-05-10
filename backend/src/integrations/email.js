import nodemailer from "nodemailer";

// ================= ENV =================
const EMAIL_USER =
  process.env.EMAIL_USER?.trim();

const EMAIL_PASS =
  process.env.EMAIL_PASS?.trim();

const ALERT_EMAIL =
  process.env.ALERT_EMAIL?.trim();

// ================= GLOBAL TRANSPORTER =================
let transporter = null;

// ================= CREATE TRANSPORTER =================
const initializeTransporter = () => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn(
        "⚠️ EMAIL_USER or EMAIL_PASS missing"
      );

      return null;
    }

    if (transporter) {
      return transporter;
    }

    transporter =
      nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,

        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },

        pool: true,
        maxConnections: 5,
        maxMessages: 100,

        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,

        tls: {
          rejectUnauthorized: false,
        },
      });

    return transporter;
  } catch (error) {
    console.error(
      "❌ Transporter initialization failed:",
      error.message
    );

    return null;
  }
};

// ================= VERIFY EMAIL =================
export const verifyEmailService =
  async (retry = 3) => {
    try {
      const mailer =
        initializeTransporter();

      if (!mailer) return;

      await mailer.verify();

      console.log(
        "✅ Email service verified"
      );
    } catch (error) {
      console.error(
        `❌ Email verification failed: ${error.message}`
      );

      // ================= RETRY =================
      if (retry > 0) {
        console.log(
          `🔄 Retrying email verification... (${retry})`
        );

        setTimeout(() => {
          verifyEmailService(
            retry - 1
          );
        }, 5000);
      }
    }
  };

// ================= SEND EMAIL =================
export const sendEmailAlert =
  async (alert = {}) => {
    try {
      const mailer =
        initializeTransporter();

      if (!mailer) {
        console.warn(
          "⚠️ Email transporter unavailable"
        );

        return;
      }

      const receiver =
        alert.recipientEmail ||
        ALERT_EMAIL;

      if (!receiver) {
        console.warn(
          "⚠️ No alert email receiver configured"
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
      const mailOptions = {
        from: `"ThreatOps Security" <${EMAIL_USER}>`,

        to: receiver,

        subject: `🚨 Threat Alert [${severity.toUpperCase()}]`,

        text: `
Threat Detected

IP: ${ip}
Attack Type: ${attackType}
Severity: ${severity}
Requests: ${requests}
Failed Logins: ${failedLogins}
Score: ${anomalyScore}
Timestamp: ${timestamp}
        `,

        html: `
        <div style="font-family: Arial; padding:20px;">
          <h2 style="color:red;">
            🚨 Threat Detected
          </h2>

          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Attack:</strong> ${attackType}</p>
          <p><strong>Severity:</strong> ${severity}</p>
          <p><strong>Requests:</strong> ${requests}</p>
          <p><strong>Failed Logins:</strong> ${failedLogins}</p>
          <p><strong>Score:</strong> ${anomalyScore}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
        </div>
        `,
      };

      const info =
        await mailer.sendMail(
          mailOptions
        );

      console.log(
        `✅ Alert email sent: ${info.messageId}`
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
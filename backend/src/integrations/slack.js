import axios from "axios";

// ================= AXIOS INSTANCE =================
const slackClient = axios.create({
  timeout: 5000, // ✅ prevent hanging
});

// ================= MAIN FUNCTION =================
export const sendSlackAlert = async (alert) => {
  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;

    if (!webhook) {
      console.warn("⚠️ Slack webhook not configured");
      return;
    }

    if (!alert) {
      console.warn("⚠️ No alert data provided");
      return;
    }

    // ================= SAFE EXTRACTION =================
    const ip = sanitize(alert.ip) || "Unknown IP";
    const type = sanitize(alert.attackType || alert.type) || "unknown";
    const severity = getSeverity(alert);
    const requests = alert.requests ?? "N/A";
    const failedLogins = alert.failedLogins ?? "N/A";
    const score = alert.anomaly_score ?? "N/A";

    // ================= MESSAGE =================
    const message = {
      text: "🚨 Threat Detected",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *Threat Detected*`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*IP:*\n${ip}` },
            { type: "mrkdwn", text: `*Type:*\n${type}` },
            { type: "mrkdwn", text: `*Severity:*\n${severity}` },
            { type: "mrkdwn", text: `*Requests:*\n${requests}` },
            { type: "mrkdwn", text: `*Failed Logins:*\n${failedLogins}` },
            { type: "mrkdwn", text: `*Score:*\n${score}` }
          ]
        }
      ]
    };

    // ================= SEND =================
    await slackClient.post(webhook, message);

    console.log("✅ Slack alert sent");

  } catch (error) {
    console.error(
      "❌ Slack Error:",
      error?.response?.data || error.message
    );
  }
};


// ================= HELPER: SANITIZE =================
const sanitize = (value) => {
  if (!value) return "";
  return String(value).replace(/[<>]/g, ""); // basic XSS-safe
};


// ================= HELPER: SEVERITY =================
const getSeverity = (alert) => {
  if (!alert) return "low";

  if (alert.attackType === "ddos" || alert.requests > 2000) {
    return "high";
  }

  if (alert.attackType === "bruteforce" || alert.failedLogins > 20) {
    return "medium";
  }

  return "low";
};
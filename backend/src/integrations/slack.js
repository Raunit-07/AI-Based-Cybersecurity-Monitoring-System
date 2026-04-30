import axios from "axios";

export const sendSlackAlert = async (alert) => {
  try {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.warn("⚠️ Slack webhook missing — skipping");
      return;
    }

    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `🚨 ALERT\nIP: ${alert.ip}\nType: ${alert.type}\nSeverity: ${alert.severity}`,
    });

    console.log("💬 Slack alert sent");
  } catch (error) {
    console.error("Slack error:", error.message);
  }
};
import axios from "axios";

export const sendSlackAlert = async (alert) => {
  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;

    // 🔍 DEBUG (you asked for this)
    console.log("Slack URL:", webhook ? "Loaded ✅" : "Missing ❌");

    if (!webhook) {
      console.warn("Slack webhook not configured");
      return;
    }

    const message = {
      text: `🚨 *Threat Detected*\nIP: ${alert.ip}\nType: ${alert.type}\nSeverity: ${alert.severity}`
    };

    await axios.post(webhook, message);

    console.log("✅ Slack alert sent");
  } catch (error) {
    console.error("❌ Slack Error:", error.response?.data || error.message);
  }
};
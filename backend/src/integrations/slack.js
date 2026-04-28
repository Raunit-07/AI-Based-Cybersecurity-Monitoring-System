const axios = require('axios');
const logger = require('../utils/logger');

let lastAlertTime = {}; // Poor man's deduplication. Use Redis for production.

const sendSlackAlert = async (alert) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('XXXXXXXXXXXXXXXXXXXXXXXX')) {
    logger.debug('Slack webhook not configured, skipping alert.');
    return;
  }

  // Deduplication check (e.g. 1 minute per source IP and type)
  const dedupKey = `${alert.source}-${alert.type}`;
  if (lastAlertTime[dedupKey] && (Date.now() - lastAlertTime[dedupKey] < 60000)) {
    return; // Skip duplicate
  }
  
  lastAlertTime[dedupKey] = Date.now();

  const payload = {
    text: `🚨 *High Severity Threat Detected* 🚨\n*Type:* ${alert.type}\n*Severity:* ${alert.severity}\n*Source:* ${alert.source}\n*Time:* ${new Date().toISOString()}`
  };

  try {
    await axios.post(webhookUrl, payload);
    logger.info(`Slack alert sent for ${dedupKey}`);
  } catch (error) {
    logger.error(`Failed to send Slack alert: ${error.message}`);
  }
};

module.exports = { sendSlackAlert };

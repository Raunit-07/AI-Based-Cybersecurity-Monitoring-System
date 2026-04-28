const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const sendEmailAlert = async (alert) => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass) {
    logger.debug('Email service not fully configured, skipping email alert.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    auth: {
      user,
      pass
    }
  });

  const mailOptions = {
    from,
    to: 'admin@threatops.com', // In production, this might be a list or fetched from config
    subject: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.type}`,
    text: `Threat Detection Alert\n\nType: ${alert.type}\nSeverity: ${alert.severity}\nSource: ${alert.source}\nTime: ${new Date().toISOString()}\n\nDetails: ${JSON.stringify(alert.details, null, 2)}`
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email alert sent for ${alert.type} from ${alert.source}`);
  } catch (error) {
    logger.error(`Failed to send email alert: ${error.message}`);
  }
};

module.exports = { sendEmailAlert };

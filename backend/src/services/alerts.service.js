const Alert = require('../models/Alert');
const { sendSlackAlert } = require('../integrations/slack');
const { sendEmailAlert } = require('../integrations/email');

const createAlert = async (alertData) => {
  const alert = new Alert(alertData);
  await alert.save();

  // Trigger integrations for high/critical severities
  if (alert.severity === 'high' || alert.severity === 'critical') {
    await sendSlackAlert(alert);
    await sendEmailAlert(alert);
  }

  return alert;
};

const getAlerts = async (query = {}, options = { limit: 50, skip: 0 }) => {
  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip)
    .limit(options.limit);
    
  const total = await Alert.countDocuments(query);
  
  return { alerts, total };
};

module.exports = {
  createAlert,
  getAlerts
};

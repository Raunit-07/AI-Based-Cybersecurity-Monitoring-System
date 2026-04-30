const Log = require('../models/log.model');
const { analyzeThreat } = require('../integrations/mlClient');
const alertsService = require('./alerts.service');
const { emitAlert } = require('../sockets');
const Alert = require('../models/alert.model');
const { detectThreat } = require('./mlClient');

const processLog = async (logData, io) => {
  // 1. Save log
  const log = await Log.create(logData);

  // 2. Send data to ML
  const mlResult = await detectThreat({
    ip: log.ip,
    requests: log.requests,
    failedLogins: log.failedLogins
  });

  let alert = null;

  // 3. If anomaly detected
  if (mlResult.is_anomaly) {
    alert = await Alert.create({
      ip: log.ip,
      type: mlResult.attack_type || 'unknown',
      severity: mlResult.anomaly_score > 0.8 ? 'critical' : 'high'
    });

    // 4. Emit real-time alert
    if (io) {
      io.emit('new-alert', alert);
    }
  }

  // 5. Emit traffic update
  if (io) {
    io.emit('traffic_update', {
      ip: log.ip,
      requests: log.requests,
      timestamp: Date.now()
    });
  }

  return {
    log,
    mlResult,
    alert
  };
};
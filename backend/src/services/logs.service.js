const Log = require('../models/Log');
const { analyzeThreat } = require('../integrations/mlClient');
const alertsService = require('./alerts.service');
const { emitAlert } = require('../sockets');

const processLog = async (logData) => {
  // 1. Analyze threat via ML/Fallback
  const analysis = await analyzeThreat(logData);
  
  // 2. Save log
  const log = new Log({
    ...logData,
    ...analysis
  });
  await log.save();

  // 3. Check threshold and generate alert if necessary
  if (analysis.anomalyScore > 70) {
    const severity = analysis.anomalyScore > 90 ? 'critical' : (analysis.anomalyScore > 80 ? 'high' : 'medium');
    
    const alert = await alertsService.createAlert({
      type: analysis.classification,
      severity,
      source: log.sourceIp,
      logReference: log._id,
      details: logData
    });

    // 4. Emit real-time alert via Socket.IO
    emitAlert(alert);
  }

  return log;
};

const getLogs = async (query = {}, options = { limit: 100, skip: 0 }) => {
  const logs = await Log.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip)
    .limit(options.limit);
    
  const total = await Log.countDocuments(query);
  
  return { logs, total };
};

module.exports = {
  processLog,
  getLogs
};

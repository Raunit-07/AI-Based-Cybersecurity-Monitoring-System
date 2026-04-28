const alertsService = require('../services/alerts.service');
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');

const getAlerts = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = parseInt(req.query.skip, 10) || 0;
  
  // To keep compatibility with frontend `/api/alerts` which expects an array,
  // we'll return both our standard wrapper and map it.
  // Wait, if frontend expects just an array, maybe we should return it directly on the alias route.
  // For the standard API, we use the standard wrapper.
  
  const { alerts, total } = await alertsService.getAlerts({}, { limit, skip });
  
  // Format for frontend compatibility: the frontend mock was returning an array of objects
  const formattedAlerts = alerts.map(a => ({
    id: a._id,
    type: a.type,
    severity: a.severity,
    source: a.source,
    time: a.createdAt.toISOString(),
    status: a.status
  }));
  
  // For standard API route
  apiResponse(res, 200, true, { alerts: formattedAlerts, total, limit, skip }, 'Alerts fetched successfully');
});

// Alias for frontend backward compatibility
const getAlertsLegacy = catchAsync(async (req, res) => {
  const { alerts } = await alertsService.getAlerts({}, { limit: 50, skip: 0 });
  const formattedAlerts = alerts.map(a => ({
    id: a._id,
    type: a.type,
    severity: a.severity,
    source: a.source,
    time: a.createdAt.toISOString(),
    status: a.status
  }));
  res.json(formattedAlerts);
});

module.exports = {
  getAlerts,
  getAlertsLegacy
};

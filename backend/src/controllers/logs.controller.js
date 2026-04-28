const logsService = require('../services/logs.service');
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');

const ingestLog = catchAsync(async (req, res) => {
  const log = await logsService.processLog(req.body);
  apiResponse(res, 201, true, { log }, 'Log ingested and processed');
});

const getLogs = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = parseInt(req.query.skip, 10) || 0;
  
  const { logs, total } = await logsService.getLogs({}, { limit, skip });
  
  apiResponse(res, 200, true, { logs, total, limit, skip }, 'Logs fetched successfully');
});

module.exports = {
  ingestLog,
  getLogs
};

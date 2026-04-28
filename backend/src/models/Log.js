const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  sourceIp: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  threatAnalyzed: {
    type: Boolean,
    default: false
  },
  anomalyScore: {
    type: Number,
    default: 0
  },
  classification: {
    type: String,
    default: 'normal'
  }
}, { strict: true, timestamps: true });

module.exports = mongoose.model('Log', logSchema);

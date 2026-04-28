const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'ignored'],
    default: 'active'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  logReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Log'
  }
}, { timestamps: true });

// Ensure alerts are sorted efficiently by time
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);

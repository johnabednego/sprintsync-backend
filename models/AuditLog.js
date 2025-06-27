const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'AI_SUGGEST'],
    required: true
  },
  entity: {
    type: String,
    enum: ['User', 'Task', 'Project', 'TimeEntry', 'Comment', 'Tag', 'AIInteraction', 'Notification'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    index: true
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
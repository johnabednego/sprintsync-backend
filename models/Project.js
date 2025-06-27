const mongoose = require('mongoose');

const STATUSES = ['planned', 'active', 'onHold', 'completed'];

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'planned',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

projectSchema.statics.STATUSES = STATUSES;

projectSchema.methods.changeStatus = function(newStatus) {
  if (!STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);
module.exports.STATUSES = STATUSES;

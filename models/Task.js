const mongoose = require('mongoose');

// Allowed status transitions: To Do → In Progress → Done
const STATUSES = ['todo', 'inProgress', 'done'];

const taskSchema = new mongoose.Schema({
  title: {
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
    default: 'todo',
    index: true
  },
  totalMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }]
}, {
  timestamps: true
});

// Expose statuses for external reference
taskSchema.statics.STATUSES = STATUSES;

// Instance method: transition status safely
// e.g., task.changeStatus('inProgress')
taskSchema.methods.changeStatus = function(newStatus) {
  if (!STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  this.status = newStatus;
  return this.save();
};

// Virtual: compute time in hours
taskSchema.virtual('hoursLogged').get(function() {
  return (this.totalMinutes / 60).toFixed(2);
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;

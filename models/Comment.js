const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Comment', commentSchema);

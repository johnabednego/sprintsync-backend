const TimeEntry = require('../models/TimeEntry');
const Task      = require('../models/Task');
const User      = require('../models/User');
const email     = require('../services/emailService');

exports.createEntry = async (req, res, next) => {
  try {
    const { taskId, minutes, startTime, endTime, notes } = req.body;
    const entry = await TimeEntry.create({ task: taskId, user: req.user._id, minutes, startTime, endTime, notes });

    // Update parent task totalMinutes
    const task = await Task.findById(taskId);
    if (task) {
      task.totalMinutes += minutes;
      await task.save();
    }

    // Notify creator and assignee
    const users = await User.find({ _id: { $in: [req.user._id, task.assignedTo] } }).select('email firstName lastName');
    const populatedEntry = await entry.populate('task', 'title');
    for (const user of users) {
      await email.sendTimeEntryNotification('created', populatedEntry, user);
    }

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

exports.getEntries = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.task) filter.task = req.query.task;
    if (req.query.user) filter.user = req.query.user;
    const entries = await TimeEntry.find(filter)
      .populate('task', 'title')
      .populate('user', 'firstName lastName')
      .sort('-createdAt');
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

exports.getEntryById = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findById(req.params.id)
      .populate('task', 'title')
      .populate('user', 'firstName lastName');
    if (!entry) return res.status(404).json({ message: 'Time entry not found' });
    res.json(entry);
  } catch (err) {
    next(err);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Time entry not found' });

    // Roll back task minutes
    const task = await Task.findById(entry.task);
    if (task) {
      task.totalMinutes = Math.max(0, task.totalMinutes - entry.minutes);
      await task.save();
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};


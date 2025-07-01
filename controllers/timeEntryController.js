// controllers/timeEntryController.js
const TimeEntry = require('../models/TimeEntry');
const Task      = require('../models/Task');
const User      = require('../models/User');
const email     = require('../services/emailService');
const withAudit = require('../utils/withAudit');

/**
 * POST /api/time-entries
 * CREATE → audit CREATE
 */
exports.createEntry = withAudit('TimeEntry','CREATE', async (req, res, next) => {
  try {
    const { taskId, minutes, startTime, endTime, notes } = req.body;
    // 1) create the entry
    const entry = await TimeEntry.create({
      task: taskId,
      user: req.user.sub,
      minutes, startTime, endTime, notes
    });

    // 2) bump parent task totalMinutes
    const task = await Task.findById(taskId);
    if (task) {
      task.totalMinutes += minutes;
      await task.save();
    }

    // 3) notify both creator and assignee
    const recipients = await User.find({
      _id: { $in: [req.user.sub, task?.assignedTo] }
    }).select('email firstName lastName');
    const populated = await entry.populate('task', 'title');
    for (const u of recipients) {
      await email.sendTimeEntryNotification('created', populated, u);
    }

    // let withAudit know what we created & who did it
    res.locals.created   = entry;
    res.locals.auditUser = req.user.sub;

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/time-entries
 * (no audit on reads)
 */
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

/**
 * GET /api/time-entries/:id
 * (no audit on reads)
 */
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

/**
 * DELETE /api/time-entries/:id
 * DELETE → audit DELETE
 */
exports.deleteEntry = withAudit('TimeEntry','DELETE', async (req, res, next) => {
  try {
    // 1) delete the entry (withAudit already captured `before`)
    const entry = await TimeEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Time entry not found' });

    // 2) roll back parent task minutes
    const task = await Task.findById(entry.task);
    if (task) {
      task.totalMinutes = Math.max(0, task.totalMinutes - entry.minutes);
      await task.save();
    }

    // tell withAudit who did it
    res.locals.auditUser = req.user.sub;

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

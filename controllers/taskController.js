const Task = require('../models/Task');
const User  = require('../models/User');
const email = require('../services/emailService');

async function notifyAssigned(task, eventType) {
  if (!task.assignedTo) return;
  const user = await User.findById(task.assignedTo).select('email firstName lastName');
  if (user) {
    await email.sendTaskNotification(eventType, task, user);
  }
}

/**
 * Create a new task
 * POST /api/tasks
 */
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, tags } = req.body;
    const task = await Task.create({ title, description, project, assignedTo, tags, createdBy: req.user.id });
    await notifyAssigned(task, 'created');
    res.status(201).json(task);
  } catch (err) { next(err); }
};

/**
 * Get all tasks (with optional filters)
 * GET /api/tasks
 */
exports.getTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.project) filter.project = req.query.project;
    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .populate('tags')
      .sort('-createdAt');
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

/**
 * Get one task by ID
 * GET /api/tasks/:id
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .populate('tags');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * Update task fields
 * PUT /api/tasks/:id
 */
exports.updateTask = async (req, res, next) => {
  try {
    const fields = (({ title, description, project, assignedTo, tags }) =>
      ({ title, description, project, assignedTo, tags }))(req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await notifyAssigned(task, 'updated');
    res.json(task);
  } catch (err) { next(err); }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

/**
 * Change task status
 * PATCH /api/tasks/:id/status
 */
exports.changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.changeStatus(status);
    await notifyAssigned(task, 'statusChanged');
    res.json(task);
  } catch (err) { next(err); }
};

/**
 * Add time to a task
 * PATCH /api/tasks/:id/time
 */
exports.addTime = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    if (minutes < 0) return res.status(400).json({ message: 'Minutes must be non-negative' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.totalMinutes += minutes;
    await task.save();
    await notifyAssigned(task, 'timeLogged');
    res.json(task);
  } catch (err) { next(err); }
};

// controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const email = require('../services/emailService');

async function notifyAssigned(task, eventType) {
  if (!task.assignedTo) return;
  const usr = await User.findById(task.assignedTo).select('email firstName lastName');
  if (usr) {
    await email.sendTaskNotification(eventType, task, usr);
  }
}

async function fullPopulate(task) {
  // Mongoose 6+: Document.populate returns a promise
  await task.populate('project', 'name');
  await task.populate('tags', 'name color');
  await task.populate('createdBy', 'firstName lastName email');
  await task.populate('assignedTo', 'firstName lastName email');
  return task;
}

exports.getTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.project) filter.project = req.query.project;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.title) filter.title = new RegExp(req.query.title, 'i');

    let sort = '-createdAt';
    if (req.query.sortBy) {
      const dir = req.query.order === 'desc' ? '-' : '';
      sort = dir + req.query.sortBy;
    }

    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort)
    ]);

    // fully populate each
    await Promise.all(tasks.map(fullPopulate));

    res.json({ page, limit, total, data: tasks });
  } catch (err) {
    next(err);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task = await fullPopulate(task);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, tags } = req.body;

    // build payload, only include optional fields when non‑empty
    const payload = { title, description, createdBy: req.user.sub };
    if (project) payload.project = project;
    if (assignedTo) payload.assignedTo = assignedTo;
    if (Array.isArray(tags) && tags.length > 0) payload.tags = tags;

    let task = await Task.create(payload);
    await notifyAssigned(task, 'created');
    task = await fullPopulate(task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};


exports.updateTask = async (req, res, next) => {
  try {
    const { title, description, project, status, assignedTo, tags } = req.body;

    // same pattern: only set fields that have real values
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (project) updates.project = project;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (status) updates.status = status;
    if (Array.isArray(tags)) updates.tags = tags;

    let task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await notifyAssigned(task, 'updated');
    task = await fullPopulate(task);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.changeStatus(status);
    await notifyAssigned(task, 'statusChanged');

    task = await fullPopulate(task);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.addTime = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    if (minutes < 0) return res.status(400).json({ message: 'Minutes must be non‑negative' });

    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.totalMinutes += minutes;
    await task.save();
    await notifyAssigned(task, 'timeLogged');

    task = await fullPopulate(task);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

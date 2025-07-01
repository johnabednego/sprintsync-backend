// controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const email = require('../services/emailService');
const withAudit = require('../utils/withAudit');

async function notifyAssigned(task, eventType) {
  if (!task.assignedTo) return;
  const usr = await User.findById(task.assignedTo).select('email firstName lastName');
  if (usr) {
    await email.sendTaskNotification(eventType, task, usr);
  }
}

async function fullPopulate(task) {
  await task.populate('project', 'name');
  await task.populate('tags', 'name color');
  await task.populate('createdBy', 'firstName lastName email');
  await task.populate('assignedTo', 'firstName lastName email');
  return task;
}

/**
 * GET /api/tasks
 * (no audit on reads)
 */
exports.getTasks = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit,10) || 20);
    const skip  = (page - 1) * limit;
    const filter = {};
    if (req.query.status)     filter.status     = req.query.status;
    if (req.query.project)    filter.project    = req.query.project;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.title)      filter.title      = new RegExp(req.query.title, 'i');

    let sort = '-createdAt';
    if (req.query.sortBy) {
      const dir = req.query.order === 'desc' ? '-' : '';
      sort = dir + req.query.sortBy;
    }

    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).skip(skip).limit(limit).sort(sort)
    ]);

    await Promise.all(tasks.map(fullPopulate));
    res.json({ page, limit, total, data: tasks });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/:id
 * (no audit on reads)
 */
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

/**
 * POST /api/tasks
 * CREATE → audit CREATE
 */
exports.createTask = withAudit('Task','CREATE', async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, tags } = req.body;
    const payload = { title, description, createdBy: req.user.sub };
    if (project)    payload.project    = project;
    if (assignedTo) payload.assignedTo = assignedTo;
    if (Array.isArray(tags) && tags.length) payload.tags = tags;

    let task = await Task.create(payload);
    await notifyAssigned(task, 'created');
    task = await fullPopulate(task);

    // let withAudit know what we created
    res.locals.created   = task;
    res.locals.auditUser = req.user.sub;

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:id
 * UPDATE → audit UPDATE
 */
exports.updateTask = withAudit('Task','UPDATE', async (req, res, next) => {
  try {
    const { title, description, project, status, assignedTo, tags } = req.body;
    const updates = {};
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (project)                   updates.project     = project;
    if (assignedTo)                updates.assignedTo  = assignedTo;
    if (status)                    updates.status      = status;
    if (Array.isArray(tags))       updates.tags        = tags;

    let task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await notifyAssigned(task, 'updated');
    task = await fullPopulate(task);

    // let withAudit know what we updated
    res.locals.updated   = task;
    res.locals.auditUser = req.user.sub;

    res.json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/status
 * UPDATE → audit UPDATE
 */
exports.changeStatus = withAudit('Task','UPDATE', async (req, res, next) => {
  try {
    const { status } = req.body;
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.changeStatus(status);
    await notifyAssigned(task, 'statusChanged');
    task = await fullPopulate(task);

    res.locals.updated   = task;
    res.locals.auditUser = req.user.sub;

    res.json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/time
 * UPDATE → audit UPDATE
 */
exports.addTime = withAudit('Task','UPDATE', async (req, res, next) => {
  try {
    const { minutes } = req.body;
    if (minutes < 0) return res.status(400).json({ message: 'Minutes must be non‑negative' });

    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.totalMinutes += minutes;
    await task.save();
    await notifyAssigned(task, 'timeLogged');
    task = await fullPopulate(task);

    res.locals.updated   = task;
    res.locals.auditUser = req.user.sub;

    res.json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * DELETE → audit DELETE
 */
exports.deleteTask = withAudit('Task','DELETE', async (req, res, next) => {
  try {
    // withAudit already grabbed `before`
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.locals.auditUser = req.user.sub;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

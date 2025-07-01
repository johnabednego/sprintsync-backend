const Project = require('../models/Project');
const User    = require('../models/User');
const email   = require('../services/emailService');

const withAudit = require('../utils/withAudit');
const { STATUSES } = require('../models/Project');

// helper to notify all members
async function notifyMembers(project, type) {
  const members = await User.find({ _id: { $in: project.members } })
    .select('email firstName lastName');
  for (const user of members) {
    await email.sendProjectNotification(type, project, user);
  }
}

exports.createProject = withAudit('Project','CREATE', async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, members } = req.body;
    const proj = await Project.create({
      name,
      description,
      startDate,
      endDate,
      members,
      createdBy: req.user.sub
    });
    await notifyMembers(proj, 'created');

    // tell audit wrapper
    res.locals.created    = proj;
    res.locals.auditUser  = req.user.sub;

    res.status(201).json(proj);
  } catch (err) {
    next(err);
  }
});

exports.getProjects = async (req, res, next) => {
  try {
    let page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    let limit = Math.max(1, parseInt(req.query.limit,10) || 20);
    const skip = (page - 1) * limit;
    const total = await Project.countDocuments();

    if (total === 0) {
      return res.json({ page, limit, total: 0, data: [] });
    }

    if (skip >= total) {
      return res.json({ page, limit, total, data: [] });
    }

    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName')
      .populate('members', 'firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    res.json({ page, limit, total, data: projects });
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const proj = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('members', 'firstName lastName');
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    res.json(proj);
  } catch (err) {
    next(err);
  }
};

exports.updateProject = withAudit('Project','UPDATE', async (req, res, next) => {
  try {
    const fields = (({ name, description, startDate, endDate, members, status }) =>
      ({ name, description, startDate, endDate, members, status }))(req.body);

    const proj = await Project.findByIdAndUpdate(
      req.params.id,
      fields,
      { new: true, runValidators: true }
    );
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    await notifyMembers(proj, 'updated');

    // audit wrapper
    res.locals.updated    = proj;
    res.locals.auditUser  = req.user.sub;

    res.json(proj);
  } catch (err) {
    next(err);
  }
});

exports.changeStatus = withAudit('Project','UPDATE', async (req, res, next) => {
  try {
    const { status } = req.body;
    const proj = await Project.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    await proj.changeStatus(status);
    await notifyMembers(proj, 'statusChanged');

    // audit wrapper
    res.locals.updated    = proj;
    res.locals.auditUser  = req.user.sub;

    res.json(proj);
  } catch (err) {
    next(err);
  }
});

exports.deleteProject = withAudit('Project','DELETE', async (req, res, next) => {
  try {
    // find before (handled by withAudit), then delete
    const proj = await Project.findByIdAndDelete(req.params.id);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

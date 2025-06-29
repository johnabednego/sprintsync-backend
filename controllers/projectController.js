// controllers/projectController.js
const Project = require('../models/Project');
const User    = require('../models/User');
const email   = require('../services/emailService');

const { STATUSES } = require('../models/Project');

// helper to notify all members
async function notifyMembers(project, type) {
  const members = await User.find({ _id: { $in: project.members } })
    .select('email firstName lastName');
  for (const user of members) {
    await email.sendProjectNotification(type, project, user);
  }
}

exports.createProject = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, members } = req.body;
    const proj = await Project.create({
      name,
      description,
      startDate,
      endDate,
      members,
      createdBy: req.user.id
    });
    await notifyMembers(proj, 'created');
    res.status(201).json(proj);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/projects
 * Supports pagination via ?page=1&limit=20
 */
// controllers/projectController.js

exports.getProjects = async (req, res, next) => {
  try {
    // parse page and limit, but enforce minimum 1
    let page  = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1)   page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;

    const skip = (page - 1) * limit;

    // total projects
    const total = await Project.countDocuments();

    // if no projects at all
    if (total === 0) {
      return res.json({ page, limit, total: 0, data: [] });
    }

    // fetch the slice
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName')
      .populate('members', 'firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // if page is beyond last
    if (skip >= total) {
      return res.json({ page, limit, total, data: [] });
    }

    // otherwise return the page
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

exports.updateProject = async (req, res, next) => {
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
    res.json(proj);
  } catch (err) {
    next(err);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const proj = await Project.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    await proj.changeStatus(status);
    await notifyMembers(proj, 'statusChanged');
    res.json(proj);
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const proj = await Project.findByIdAndDelete(req.params.id);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

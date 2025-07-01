// controllers/tagController.js
const Tag    = require('../models/Tag');
const User   = require('../models/User');
const { sendTagNotification } = require('../services/emailService');
const withAudit = require('../utils/withAudit');

async function notifyAdmins(tag, type) {
  const admins = await User.find({ isAdmin: true }).select('email firstName lastName');
  for (const admin of admins) {
    await sendTagNotification(type, tag, admin);
  }
}

/**
 * POST /api/tags
 * CREATE → audit CREATE
 */
exports.createTag = withAudit('Tag','CREATE', async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const tag = await Tag.create({
      name, color, description,
      createdBy: req.user.id
    });
    await tag.populate('createdBy', 'firstName lastName');
    await notifyAdmins(tag, 'created');

    // let withAudit know what we created
    res.locals.created   = tag;
    res.locals.auditUser = req.user.id;

    res.status(201).json(tag);
  } catch (err) { next(err); }
});

/**
 * GET /api/tags
 * (no audit on reads)
 */
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find()
      .populate('createdBy', 'firstName lastName')
      .sort('name');
    res.json(tags);
  } catch (err) { next(err); }
};

/**
 * GET /api/tags/:id
 * (no audit on reads)
 */
exports.getTagById = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json(tag);
  } catch (err) { next(err); }
};

/**
 * PUT /api/tags/:id
 * UPDATE → audit UPDATE
 */
exports.updateTag = withAudit('Tag','UPDATE', async (req, res, next) => {
  try {
    // let withAudit capture `before` by doing `Tag.findById` internally
    const updates = (({ name, color, description }) => ({ name, color, description }))(req.body);
    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');
    if (!tag) return res.status(404).json({ message: 'Tag not found' });

    await notifyAdmins(tag, 'updated');

    // let withAudit know what we updated
    res.locals.updated   = tag;
    res.locals.auditUser = req.user.id;

    res.json(tag);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/tags/:id
 * DELETE → audit DELETE
 */
exports.deleteTag = withAudit('Tag','DELETE', async (req, res, next) => {
  try {
    // withAudit already grabbed `before`
    const tag = await Tag.findByIdAndDelete(req.params.id)
      .populate('createdBy', 'firstName lastName');
    if (!tag) return res.status(404).json({ message: 'Tag not found' });

    await notifyAdmins(tag, 'deleted');

    res.locals.auditUser = req.user.id;
    res.status(204).end();
  } catch (err) { next(err); }
});

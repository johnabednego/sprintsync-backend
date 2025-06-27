const Tag    = require('../models/Tag');
const User   = require('../models/User');
const { sendTagNotification } = require('../services/emailService');

async function notifyAdmins(tag, type) {
  // notify all isAdmin users
  const admins = await User.find({ isAdmin: true }).select('email firstName lastName');
  for (const admin of admins) {
    await sendTagNotification(type, tag, admin);
  }
}

exports.createTag = async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const tag = await Tag.create({
      name, color, description,
      createdBy: req.user._id
    });
    await tag.populate('createdBy', 'firstName lastName');
    await notifyAdmins(tag, 'created');
    res.status(201).json(tag);
  } catch (err) { next(err); }
};

exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find()
      .populate('createdBy', 'firstName lastName')
      .sort('name');
    res.json(tags);
  } catch (err) { next(err); }
};

exports.getTagById = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json(tag);
  } catch (err) { next(err); }
};

exports.updateTag = async (req, res, next) => {
  try {
    const updates = (({ name, color, description }) => ({ name, color, description }))(req.body);
    const tag = await Tag.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true
    }).populate('createdBy', 'firstName lastName');
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    await notifyAdmins(tag, 'updated');
    res.json(tag);
  } catch (err) { next(err); }
};

exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id)
      .populate('createdBy', 'firstName lastName');
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    await notifyAdmins(tag, 'deleted');
    res.status(204).end();
  } catch (err) { next(err); }
};

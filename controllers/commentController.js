const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendCommentNotification } = require('../services/emailService');

/**
 * Create and notify
 */
exports.createComment = async (req, res, next) => {
  try {
    const { taskId, text } = req.body;

    // create
    const comment = await Comment.create({
      author: req.user.id,
      task: taskId,
      text
    });

    // populate author & task
    await comment.populate('author', 'firstName lastName email')
    await comment.populate('task', 'title assignedTo createdBy')

    // gather recipients: task creator + assignee (excluding commenter)
    const userIds = new Set([
      comment.task.createdBy.toString(),
      comment.task.assignedTo?.toString()
    ]);
    userIds.delete(req.user.id.toString());

    const recipients = await User.find({ _id: { $in: [...userIds] } })
      .select('firstName lastName email');

    // notify each
    for (const u of recipients) {
      await sendCommentNotification(comment, u);
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

/**
 * List comments for a task
 */
exports.getCommentsByTask = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'firstName lastName')
      .sort('createdAt');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};


/**
 * Delete a comment
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

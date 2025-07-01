const Comment = require('../models/Comment');
const User = require('../models/User');
const { sendCommentNotification } = require('../services/emailService');
const withAudit = require('../utils/withAudit');

async function notifyCommentRecipients(comment) {
  // gather recipients: task creator + assignee (excluding commenter)
  await comment.populate('task', 'createdBy assignedTo');
  const userIds = new Set([
    comment.task.createdBy.toString(),
    comment.task.assignedTo?.toString()
  ]);
  userIds.delete(comment.author.toString());

  const recipients = await User.find({ _id: { $in: [...userIds] } })
    .select('firstName lastName email');

  for (const recipient of recipients) {
    await sendCommentNotification(comment, recipient);
  }
}

/**
 * POST /api/comments
 * CREATE → audit CREATE
 */
exports.createComment = withAudit('Comment', 'CREATE', async (req, res, next) => {
  try {
    const { taskId, text } = req.body;

    // create
    const comment = await Comment.create({
      author: req.user.id,
      task: taskId,
      text
    });

    // populate author & task for response
    await comment.populate('author', 'firstName lastName email');
    await comment.populate('task', 'title assignedTo createdBy');

    // notify recipients
    res.locals.created = comment;
    res.locals.auditUser = req.user.id;
    await notifyCommentRecipients(comment);

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/comments/task/:taskId
 * (no audit on reads)
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
 * DELETE /api/comments/:id
 * DELETE → audit DELETE
 */
exports.deleteComment = withAudit('Comment', 'DELETE', async (req, res, next) => {
  try {
    // withAudit captures `before` state
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    res.locals.auditUser = req.user.id;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

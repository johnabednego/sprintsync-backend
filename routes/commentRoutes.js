const router = require('express').Router();
const ctl    = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Task comments
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId, text]
 *             properties:
 *               taskId:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 */
router.post('/', requireAuth, ctl.createComment);

/**
 * @swagger
 * /comments/task/{taskId}:
 *   get:
 *     summary: List comments for a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of comments
 */
router.get('/task/:taskId', requireAuth, ctl.getCommentsByTask);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Comment deleted
 */
router.delete('/:id', requireAuth, ctl.deleteComment);

module.exports = router;

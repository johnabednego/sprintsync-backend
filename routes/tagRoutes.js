const router = require('express').Router();
const ctl    = require('../controllers/tagController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Label tasks for filtering & analytics
 */

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a new tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *                 description: Hex code (e.g. #FF0000)
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created
 */
router.post('/', requireAuth, requireAdmin, ctl.createTag);

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: List all tags
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tag objects
 */
router.get('/', requireAuth, ctl.getTags);

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Get tag by ID
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag object
 *       404:
 *         description: Tag not found
 */
router.get('/:id', requireAuth, ctl.getTagById);

/**
 * @swagger
 * /tags/{id}:
 *   put:
 *     summary: Update a tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated tag
 *       404:
 *         description: Tag not found
 */
router.put('/:id', requireAuth, requireAdmin, ctl.updateTag);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     summary: Delete a tag (admin only)
 *     tags: [Tags]
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
 *         description: Tag deleted
 *       404:
 *         description: Tag not found
 */
router.delete('/:id', requireAuth, requireAdmin, ctl.deleteTag);

module.exports = router;

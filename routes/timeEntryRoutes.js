const router = require('express').Router();
const ctl    = require('../controllers/timeEntryController');
const { requireAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: TimeEntries
 *   description: Work time logging
 */

/**
 * @swagger
 * /time-entries:
 *   post:
 *     summary: Log time for a task
 *     tags: [TimeEntries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId, minutes, startTime]
 *             properties:
 *               taskId:
 *                 type: string
 *               minutes:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Time entry created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeEntry'
 */
router.post('/', requireAuth, ctl.createEntry);

/**
 * @swagger
 * /time-entries:
 *   get:
 *     summary: List time entries (filter by task/user)
 *     tags: [TimeEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: task
 *         schema:
 *           type: string
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of time entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimeEntry'
 */
router.get('/', requireAuth, ctl.getEntries);

/**
 * @swagger
 * /time-entries/{id}:
 *   get:
 *     summary: Get a time entry by ID
 *     tags: [TimeEntries]
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
 *         description: The time entry data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeEntry'
 *       404:
 *         description: Time entry not found
 */
router.get('/:id', requireAuth, ctl.getEntryById);

/**
 * @swagger
 * /time-entries/{id}:
 *   delete:
 *     summary: Delete a time entry
 *     tags: [TimeEntries]
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
 *         description: Time entry deleted
 *       404:
 *         description: Time entry not found
 */
router.delete('/:id', requireAuth, ctl.deleteEntry);

module.exports = router;

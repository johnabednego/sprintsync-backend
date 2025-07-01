// routes/stats.js
const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const ctl = require('../controllers/statsController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Stats endpoints for users and admins
 */

/**
 * @swagger
 * /stats/admin:
 *   get:
 *     summary: Get admin statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 totalUsers: 100
 *                 activeProjects: 25
 *                 systemLoad: "Moderate"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin', requireAuth, requireAdmin, ctl.adminStats);

/**
 * @swagger
 * /stats/me:
 *   get:
 *     summary: Get personal user statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 tasksCompleted: 50
 *                 hoursLogged: 120
 *                 projectsInvolved: 4
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', requireAuth, ctl.userStats);

/**
 * @swagger
 * /stats/time-per-day:
 *   get:
 *     summary: Get total time logged per day (by the authenticated user)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Time logged per day
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   totalMinutes:
 *                     type: number
 *               example:
 *                 - date: "2025-06-25"
 *                   totalMinutes: 120
 *                 - date: "2025-06-26"
 *                   totalMinutes: 95
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/time-per-day', requireAuth, ctl.timePerDay);

module.exports = router;

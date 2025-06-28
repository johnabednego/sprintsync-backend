const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const aiCtl = require('../controllers/aiController');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-assisted suggestions
 */

/**
 * @swagger
 * /ai/suggest:
 *   post:
 *     summary: Get an AI-powered suggestion (stubbed)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - payload
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [draftDescription, dailyPlan]
 *                 description: Which suggestion to generate
 *               payload:
 *                 type: object
 *                 description: Mode-specific data
 *     responses:
 *       200:
 *         description: Suggestion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: AI service unavailable
 */
router.post('/suggest', requireAuth, aiCtl.suggest);

module.exports = router;

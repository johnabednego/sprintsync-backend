const aiService = require('../services/aiService');

/**
 * POST /ai/suggest
 * Body: { mode: 'draftDescription' | 'dailyPlan', payload: {...} }
 */
exports.suggest = async (req, res) => {
  const userId = req.user.sub;
  const { mode, payload } = req.body;

  console.info('AI suggest request', { userId, mode });

  try {
    const result = await aiService.getSuggestion({ mode, payload });
    console.info('AI suggest success', { userId, mode });
    return res.json({ ok: true, data: result });
  } catch (err) {
    console.error('AI suggest error', { userId, mode, message: err.message });
    // graceful degradation
    return res.status(500).json({
      ok: false,
      error: 'AI service unavailable. Please try again later.'
    });
  }
};

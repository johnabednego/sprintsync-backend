const AuditLog = require('../models/AuditLog');
const { sendAuditNotification } = require('../services/emailService');

exports.listLogs = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  try {
    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(parseInt(skip, 10))
        .limit(parseInt(limit, 10))
        .populate('user', 'firstName lastName email')
    ]);
    res.json({ page: parseInt(page, 10), limit: parseInt(limit, 10), total, data: logs });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'firstName lastName email');
    if (!log) return res.status(404).json({ message: 'Audit log not found' });
    res.json(log);
  } catch (err) {
    console.error('Error fetching audit log:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Optional: manual create endpoint if needed
exports.createLog = async (req, res) => {
  try {
    const log = new AuditLog({
      user: req.user.sub,
      ...req.body
    });
    await log.save();

    // Populate user details (so we have firstName/lastName/email)
    await log.populate('user', 'firstName lastName email').execPopulate();

    // Decide recipient(s): here, send to the actioning user
    const recipient = log.user.email;
    await sendAuditNotification(recipient, log);

    res.status(201).json(log);
  } catch (err) {
    console.error('Error creating audit log:', err);
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
};
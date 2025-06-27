// controllers/userController.js

const User = require('../models/User');

/**
 * GET /api/users/me
 * Protected; returns the current user.
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/me
 * Protected; update your own profile fields.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    // whitelist what users can change themselves
    ['firstName','lastName','profile','preferences','notificationSettings'].forEach(fld => {
      if (req.body[fld] !== undefined) updates[fld] = req.body[fld];
    });
    updates.lastUpdatedBy = req.user.sub;

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/me/change-password
 * Protected; Body: { currentPassword, newPassword }
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.sub).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await user.verifyPassword(currentPassword);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = newPassword;  // hashed by pre-save
    user.lastUpdatedBy = req.user.sub;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/
 * Admin-only; list all users (with pagination).
 * Query: ?page=1&limit=20
 */
exports.listUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);

    const [users, total] = await Promise.all([
      User.find()
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments()
    ]);

    res.json({
      page,
      limit,
      total,
      data: users.map(u => u.toJSON())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Admin-only; fetch any user by ID.
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id
 * Admin-only; update any user.
 * Body: any subset of fields except password.
 */
exports.updateUserById = async (req, res, next) => {
  try {
    const whitelist = [
      'firstName','lastName','profile',
      'preferences','notificationSettings','isAdmin'
    ];
    const updates = {};
    whitelist.forEach(fld => {
      if (req.body[fld] !== undefined) updates[fld] = req.body[fld];
    });
    updates.lastUpdatedBy = req.user.sub;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Admin-only; remove a user.
 */
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

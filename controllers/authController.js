// controllers/authController.js

const User         = require('../models/User');
const emailService = require('../services/emailService');
const tokenService = require('../services/tokenService');

/**
 * POST /api/auth/signup
 * Body: {
 *   firstName, lastName, email, password,
 *   avatarUrl?, phoneNumber?, address?,
 *   emailOnAssignment?, emailOnComment?, pushOnDailySummary?
 * }
 *
 * - Creates the user (emailVerified: false)
 * - Generates an emailVerification OTP, emails it
 */
exports.signup = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,

      // flattened “profile” fields
      avatarUrl = '',
      phoneNumber = '',
      address = {},            // e.g. { country: '', city: '' }

      // flattened notification settings
      emailOnAssignment = true,
      emailOnComment    = true,
      pushOnDailySummary= false,
    } = req.body;

    // check for existing email
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,

      // profile/contact
      avatarUrl,
      phoneNumber,
      address,

      // notification flags
      emailOnAssignment,
      emailOnComment,
      pushOnDailySummary,
    });

    // generate & save OTP
    const otp = user.generateOTP('emailVerification');
    await user.save();

    // send email
    await emailService.sendOTP(email, otp);

    // respond with success
    res.status(201).json({
      message: 'Signup successful—OTP sent for email verification.',
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-email
 * Body: { email, otp }
 *
 * - Validates the OTP, marks emailVerified, clears OTP
 * - Returns JWT + user
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email })
      .select('+otp +otpExpiry +otpPurpose');

    if (!user || !user.verifyOTP(otp, 'emailVerification')) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.emailVerified = true;
    user.clearOTP();
    await user.save();

    const token = tokenService.generateAccessToken(user);
    res.json({ message: 'Email verified', token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * - Rejects login if email not verified
 * - Issues JWT on success
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .select('+password');

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    const token = tokenService.generateAccessToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * - Generates a passwordReset OTP and emails it
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // avoid leaking
      return res.json({ message: 'If that email is registered, you’ll receive a reset code.' });
    }

    const otp = user.generateOTP('passwordReset');
    await user.save();
    await emailService.sendOTP(email, otp);

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 *
 * - Validates the OTP, updates password, clears OTP
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email })
      .select('+password +otp +otpExpiry +otpPurpose');

    if (!user || !user.verifyOTP(otp, 'passwordReset')) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword; // pre-save hook will hash
    user.clearOTP();
    await user.save();

    res.json({ message: 'Password successfully reset. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend-otp
 * Body: { email, purpose }
 *
 * - `purpose` must be "emailVerification" or "passwordReset"
 * - Only sends a new OTP if none exists or the existing one has expired
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!User.OTP_PURPOSES.includes(purpose)) {
      return res.status(400).json({ message: 'Invalid purpose' });
    }

    const user = await User.findOne({ email })
      .select('+otp +otpExpiry +otpPurpose +emailVerified');
    if (!user) {
      // avoid revealing which emails exist
      return res.status(200).json({ message: 'If eligible, a new code will be sent.' });
    }

    // block duplicate resend if still valid
    if (user.otp && user.otpExpiry && Date.now() < user.otpExpiry) {
      return res
        .status(400)
        .json({ message: 'A valid code has already been sent. Please wait until it expires.' });
    }

    // signup case: if they already verified, block
    if (purpose === 'emailVerification' && user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // generate, save, and send
    const code = user.generateOTP(purpose);
    await user.save();
    await emailService.sendOTP(email, code);

    res.json({ message: `New OTP sent for ${purpose}.` });
  } catch (err) {
    next(err);
  }
};

// models/User.js

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');

const profileSchema               = require('./Profile');
const notificationSettingsSchema  = require('./NotificationSettings');

const userSchema = new mongoose.Schema({
  // ————— Core Identity —————
  email: {
    type:     String,
    required: true,
    unique:   true,
    lowercase:true,
    trim:     true,
    index:    true
  },
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },

  // ————— Auth —————
  // this field holds the bcrypt hash; select:false keeps it out of queries by default
  password:             { type: String, required: true, select: false },
  isAdmin:              { type: Boolean, default: false },

  // ————— Profile & Contact —————
  profile: {
    type:    profileSchema,
    default: () => ({})
  },

  // ————— Preferences & Notifications —————
  preferences: {
    theme:        { type: String, enum: ['light','dark'], default: 'light' },
    timezone:     { type: String, default: 'UTC' },
    itemsPerPage: { type: Number, default: 20 }
  },
  notificationSettings: {
    type:    notificationSettingsSchema,
    default: () => ({})
  },

  // ————— Next-Level Enhancements —————
  emailVerified:        { type: Boolean, default: false },
  emailVerifyToken:     { type: String, select: false },
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date,   select: false },

  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User'
  }
}, {
  timestamps: true,
});



/**
 * Virtual: fullName
 */
userSchema.virtual('fullName')
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });


/**
 * Pre-save hook:
 * - If the password field has been created or modified, hash it.
 */
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});


/**
 * Generate a one-time token for email verification.
 */
userSchema.methods.generateEmailVerifyToken = function () {
  this.emailVerifyToken = crypto.randomBytes(20).toString('hex');
  return this.emailVerifyToken;
};

/**
 * Generate a password-reset token & expiry.
 */
userSchema.methods.generatePasswordReset = function () {
  this.resetPasswordToken   = crypto.randomBytes(20).toString('hex');
  this.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour
  return this.resetPasswordToken;
};


/**
 * Compare a candidate plaintext password to the stored hash.
 * @param {string} candidate 
 * @returns {Promise<boolean>}
 */
userSchema.methods.verifyPassword = function (candidate) {
  // when fetching user, remember to include '+password' in the query
  return bcrypt.compare(candidate, this.password);
};


/**
 * toJSON override: remove sensitive/internal fields before sending to client.
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};


module.exports = mongoose.model('User', userSchema);

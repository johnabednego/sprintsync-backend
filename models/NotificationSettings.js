// models/NotificationSettings.js
const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  emailOnAssignment:  { type: Boolean, default: true },
  emailOnComment:     { type: Boolean, default: true },
  pushOnDailySummary: { type: Boolean, default: false },
}, { _id: false });

module.exports = notificationSettingsSchema;

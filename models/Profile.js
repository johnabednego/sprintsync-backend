// models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  avatarUrl:   { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  address: {
    country: { type: String, default: '' },
    city:    { type: String, default: '' },
  }
}, { _id: false });

module.exports = profileSchema;

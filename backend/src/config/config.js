require('dotenv').config();
const supabase = require('./supabase.config');
const mqtt = require('./mqtt.config');
const nodeMailer = require('./nodeMailer.config');
const redis = require('./redis.config');
const jwt = require('./jwt.config');
const otp = require('./otp.config');

module.exports = {
  port: process.env.PORT || 3000,

  supabase,
  mqtt,
  nodeMailer,
  redis,
  jwt,
  otp,
}
require('dotenv').config();
const supabase = require('./supabaseConfig');
const mqtt = require('./mqttConfig');
const nodeMailer = require('./nodeMailer');
const redis = require('./redisConfig');

module.exports = {
  port: process.env.PORT || 3000,

  supabase,
  mqtt,
  nodeMailer,
  redis,
}
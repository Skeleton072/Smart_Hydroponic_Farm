require('dotenv').config();
const supabase = require('./supabaseConfig');
const mqtt = require('./mqttConfig');

module.exports = {
  port: process.env.PORT || 3000,

  supabase,
  mqtt,
}
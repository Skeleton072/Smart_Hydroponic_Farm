require('dotenv').config();
const supabase = require('./supabaseConfig');

module.exports = {
  port: process.env.PORT || 3000,

  supabase,
}
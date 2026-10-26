const { createClient } = require("@supabase/supabase-js");
const config = require("./config");

const supabase = createClient(
  config.supabase.superbaseUrl,
  config.supabase.superbaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
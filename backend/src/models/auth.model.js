const supabase = require("../config/supabase");

async function findByEmail(email) {
  const { data, error } = await supabase
    .from("User")
    .select("user_name, email, password")
    .eq("email", email)
    .single();

  // PGRST116 corresponds to PostgREST code for "No rows found"
  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data || null;
}

async function createAccount(user_name, email, hashedPassword) {
  const { error } = await supabase
    .from("User")
    .insert({ user_name, email, password: hashedPassword });

  if (error) throw new Error(error.message);

  console.log("Successfully created an account.");
}

module.exports = { findByEmail, createAccount };
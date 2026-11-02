const supabase = require("../config/supabase");

async function findByEmail(email) {
  const { data, error } = await supabase
    .from("User")
    .select("user_name, email, password")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data || null;
}

async function createAccount(user_name, email, hashedPassword) {
  const { data, error } = await supabase
    .from("User")
    .insert({ user_name, email, password: hashedPassword })
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);

  console.log("Successfully created an account.");

  return data.user_id;
}

module.exports = { findByEmail, createAccount };
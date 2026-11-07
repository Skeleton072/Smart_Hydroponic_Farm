const { findByEmail, createAccount } = require("../models/auth.model");
const redisClient = require("../config/redis");
const argon2 = require("argon2");
const { sendEmail, returnHTML } = require("../utils/sendEmail");

async function registerUser(user_name, email, password) {
  console.log("Registering user...");
  const existingUser = await findByEmail(email);

  if (existingUser) {
    throw new Error("Email has already been registered");
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const passwordHashed = await argon2.hash(password);
  const otp_hash = await argon2.hash(otpCode);

  const verificationRecord = {
    email,
    user_name,
    password_hash: passwordHashed,
    otp_hash,
    attempts: 0
  };

  const redisKey = `verify:${email}`;
  const html = returnHTML(otpCode);
  await redisClient.set(redisKey, JSON.stringify(verificationRecord), "EX", 300);
  await sendEmail(email, "Email Verification", html);
}

async function verifyUser(email, password) {
  const user = await findByEmail(email);

  if (!user) {
    throw new Error("Email has not been registered.");
  }
  
  const isMatch = await argon2.verify(user.password, password);

  if (!isMatch) {
    throw new Error("Password doesn't match.");
  }
  
  return user.user_id;
}

async function completeRegistration(redisKey) {
  const rawData = await redisClient.get(redisKey);
  if (!rawData) throw new Error("Verification session expired or not found.");

  const data = JSON.parse(rawData);
  const user_id = await createAccount(data.user_name, data.email, data.password_hash);
  await redisClient.del(redisKey);

  return user_id;
}

module.exports = { registerUser, verifyUser, completeRegistration };
const { findByEmail, createAccount } = require("../models/auth.model");
const redisClient = require("../config/redis");
const argon2 = require("argon2");
const { sendEmail, returnHTML } = require("../utils/sendEmail");
const { serviceError } = require("../utils/errorHandling");

const OTP_TTL_SECONDS = 300;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 3;
const ARGON2_OPTS = { type: argon2.argon2id };

const verifyKey = (email) => `verify:${email}`;
const attemptsKey = (email) => `verify:attempts:${email}`;
const resendKey = (email) => `verify:resend:${email}`;


// HELPER FUNCTIONS
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function loadVerification(email) {
  const rawData = await redisClient.get(verifyKey(email));
  if (!rawData) throw serviceError("OTP_EXPIRED");

  try {
    return JSON.parse(rawData);
  } catch (cause) {
    // Corrupt payload
    await redisClient.del(verifyKey(email));
    console.log({ email }, "Corrupt verification record purged");
    throw serviceError("OTP_EXPIRED", cause);
  }
}

async function bumpAttempts(email) {
  const key = attemptsKey(email);
  const attempts = await redisClient.incr(key);

  if (attempts === 1) {
    await redisClient.expire(key, OTP_TTL_SECONDS);
  }

  if (attempts > MAX_OTP_ATTEMPTS) {
    await Promise.all([redisClient.del(verifyKey(email)), redisClient.del(key)]);
    throw serviceError("OTP_LOCKED");
  }

  return attempts;
}

/**
 * @throws { EMAIL_EXISTS, EMAIL_SEND_FAILED }
 */
async function startSignup(user_name, email, password) {
  const existingUser = await findByEmail(email);

  if (existingUser) {
    throw serviceError("EMAIL_EXISTS");
  }

  const otpCode = generateOtp();
  const [passwordHash, otpHash] = await Promise.all([
    argon2.hash(password, ARGON2_OPTS),
    argon2.hash(otpCode, ARGON2_OPTS),
  ]);

  const verificationRecord = {
    email,
    user_name,
    password_hash: passwordHash,
    otp_hash: otpHash,
    attempts: 0
  };

  await redisClient
    .multi()
    .set(verifyKey(email), JSON.stringify(verificationRecord), "EX", OTP_TTL_SECONDS)
    .set(resendKey(email), "1", "EX", OTP_RESEND_COOLDOWN_SECONDS)
    .exec();

  try {
    await sendEmail(email, "Email Verification", returnHTML(otpCode));
  } catch (cause) {
    await redisClient.del(verifyKey(email));
    console.error({ err: cause, email }, "Failed to send verification email");
    throw serviceError("EMAIL_SEND_FAILED", cause);
  }
}

/**
 * @throws { INVALID_CREDENTIALS }
 */
async function authenticate(email, password) {
  const user = await findByEmail(email);

  const hash = user?.password ?? "$argon2id$v=19$m=65536,t=3,p=4$invalid$invalid";
  const isMatch = await argon2.verify(hash, password).catch(() => false);

  if (!user || !isMatch) {
    throw serviceError("INVALID_CREDENTIALS");
  }
  
  return user.user_id;
}

/**
 * @returns { user_id }
 * @throws { WRONG_OTP }
 */
async function verifyOtp(email, otp) {
  const data = await loadVerification(email);

  const isMatch = await argon2.verify(data.otp_hash, otp).catch(() => false);
  if (!isMatch) {
    await bumpAttempts(email);
    throw serviceError("WRONG_OTP");
  }

  const user_id = await createAccount(data.user_name, data.email, data.password_hash);

  await Promise.all([
    redisClient.del(verifyKey(email)),
    redisClient.del(attemptsKey(email)),
    redisClient.del(resendKey(email)),
  ]);

  return user_id;
}

/**
 * @throws { RESEND_COOLDOWN }
 */
async function resendOtp({ email }) {
  const data = await loadVerification(email);

  // NX -> Not eXist, only created if the key doesn't exist in database
  const acquired = await redisClient.set(
    resendKey(email),
    "1",
    "EX",
    OTP_RESEND_COOLDOWN_SECONDS,
    "NX"
  );

  if (acquired === null) {
    throw serviceError("RESEND_COOLDOWN");
  }

  const otpCode = generateOtp();
  const otpHash = await argon2.hash(otpCode, ARGON2_OPTS);

  const updated = { ...data, otp_hash: otpHash };

  await redisClient.multi()
    .set(verifyKey(email), JSON.stringify(updated), "EX", OTP_TTL_SECONDS)
    .del(attemptsKey(email))
    .exec();

  try {
    await sendEmail(email, "Email Verification", returnHTML(otpCode));
  } catch (cause) {
    console.error({ err: cause, email }, "Failed to resend verification email");
    await redisClient.del(resendKey(email));
    throw serviceError("EMAIL_SEND_FAILED", cause);
  }
}

module.exports = { startSignup, authenticate, verifyOtp, resendOtp };
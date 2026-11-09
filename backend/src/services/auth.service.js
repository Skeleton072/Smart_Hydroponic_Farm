const { findByEmail, createAccount } = require("../models/auth.model");
const redisClient = require("../config/redis");
const argon2 = require("argon2");
const crypto = require("crypto");
const { sendEmail, returnHTML } = require("../utils/sendEmail");
const { serviceError, CODES } = require("../utils/errorHandling");
const config = require("../config/config");

const OTP_TTL_SECONDS = 600;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_TEMPORARY_LOCK_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 3;
const SIGNUP_COOLDOWN_SECONDS = 60;

const OTP_PEPPER = config.otp.otpPepper;

const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MiB, OWASP 2024 recommendation for argon2id
  timeCost: 2,
  parallelism: 1,
};

const verifyKey   = (email) => `verify:${email}`;
const attemptsKey = (email) => `verify:attempts:${email}`;
const resendKey   = (email) => `verify:resend:${email}`;
const lockKey     = (email) => `otp:lock:${email}`;
const blockKey    = (email) => `otp:block:${email}`;
const signupKey   = (email) => `signup:cooldown:${email}`;

// ---------- helpers ----------
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHmac("sha256", OTP_PEPPER).update(otp).digest("hex");
}

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;

  // Buffer.from() -> a fixed-length sequence of bytes stored outside the V8 JavaScript engine heap, 
  //                  specifically designed to handle raw binary data
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;

  return crypto.timingSafeEqual(ab, bb);
};

async function loadVerification(email) {
  const [lockTTL, isBlocked] = await Promise.all([
    redisClient.ttl(lockKey(email)),
    redisClient.exists(blockKey(email)),
  ]);

  if (lockTTL > 0) {
    throw serviceError(CODES.OTP_LOCKED, null, { ttl: lockTTL });
  }
  
  if (isBlocked) {
    throw serviceError(CODES.ACCOUNT_BLOCKED);
  }

  const rawData = await redisClient.get(verifyKey(email));
  if (!rawData) throw serviceError(CODES.OTP_EXPIRED);

  try {
    return JSON.parse(rawData);
  } catch (cause) {
    await redisClient.del(verifyKey(email));
    throw serviceError(CODES.OTP_EXPIRED, cause);
  }
}

/**
 * Increments attempt counter.
 * Does NOT throw on lock — caller decides HTTP shape.
 * @returns { attempts, locked }
 */
async function bumpAttempts(email) {
  const key = attemptsKey(email);
  const attempts = await redisClient.incr(key);

  if (attempts === 1) {
    await redisClient.expire(key, OTP_TTL_SECONDS);
  }

  if (attempts >= MAX_OTP_ATTEMPTS) {
    const ttl = OTP_TEMPORARY_LOCK_SECONDS;
    await redisClient
      .multi()
      .set(lockKey(email), "1", "EX", ttl)
      // .del(verifyKey(email))
      .del(key)
      .exec();

    return { attempts, locked: true, ttl };
  }

  return { attempts, locked: false };
}

// ---------- public API ----------
async function startSignup(user_name, email, password) {
  const existing = await findByEmail(email);
  if (existing) {
    throw serviceError(CODES.EMAIL_EXISTS);
  }

  const acquired = await redisClient.set(
    signupKey(email),
    "1",
    "EX",
    SIGNUP_COOLDOWN_SECONDS,
    "NX"
  );
  if (acquired === null) throw serviceError(CODES.TOO_MANY_REQUESTS);

  const otpCode = generateOtp();
  const otpHash = hashOtp(otpCode);

  // why Promise.all() ??
  const [passwordHash] = await Promise.all([
    argon2.hash(password, ARGON2_OPTS),
  ]);

  const record = {
    email,
    user_name,
    password_hash: passwordHash,
    otp_hash: otpHash,
  };

  const execResult = await redisClient
    .multi()
    .set(verifyKey(email), JSON.stringify(record), "EX", OTP_TTL_SECONDS)
    .set(resendKey(email), "1", "EX", OTP_RESEND_COOLDOWN_SECONDS)
    .del(attemptsKey(email))
    .exec();

  if (execResult.some(([err]) => err)) {
    await redisClient.del(verifyKey(email)).catch(() => {});
    throw serviceError(CODES.INTERNAL);
  }

  try {
    // await sendEmail(email, "Email Verification", returnHTML(otpCode));
    console.log("OTP code sent successfully: ", otpCode);
  } catch (cause) {
    await redisClient.multi()
      .del(verifyKey(email))
      .del(resendKey(email))
      .exec();
    throw serviceError(CODES.EMAIL_SEND_FAILED, cause);
  }
}

async function authenticate(email, password) {
  const user = await findByEmail(email);

  const hash = user?.password;

  let isMatch = false;
  try {
    isMatch = await argon2.verify(hash, password);
  } catch {
    isMatch = false;
  }

  if (!user || !isMatch) {
    throw serviceError(CODES.INVALID_CREDENTIALS);
  }

  return user.user_id;
}

async function verifyOtp(email, otp) {
  const data = await loadVerification(email);

  const incoming = hashOtp(otp);
  const isMatch = safeEqualHex(incoming, data.otp_hash);

  if (!isMatch) {
    const { locked, ttl } = await bumpAttempts(email);
    if (locked) throw serviceError(CODES.OTP_LOCKED, null, { ttl });
    throw serviceError(CODES.WRONG_OTP);
  }

  // Claim the verification record atomically to prevent double-signup races.
  const claimed = await redisClient.del(verifyKey(email));
  if (claimed === 0) {
    // Someone else already consumed it.
    throw serviceError(CODES.OTP_EXPIRED);
  }

  let user_id;
  try {
    user_id = await createAccount(data.user_name, data.email, data.password_hash);
  } catch (cause) {
    // Best-effort: restore so user can retry (unless it's a duplicate-email race).
    if (cause?.code === "EMAIL_EXISTS" || cause?.code === "23505") {
      await Promise.all([
        redisClient.del(attemptsKey(email)),
        redisClient.del(resendKey(email)),
      ]);
    } else {
      await redisClient.set(verifyKey(email), JSON.stringify(data), "EX", OTP_TTL_SECONDS);
    }

    throw cause?.isServiceError ? cause : serviceError(CODES.INTERNAL, cause);
  }

  await Promise.all([
    redisClient.del(attemptsKey(email)),
    redisClient.del(resendKey(email)),
    redisClient.del(signupKey(email)),
  ]);

  return user_id;
}

async function resendOtp(email) {
  const data = await loadVerification(email);

  const acquired = await redisClient.set(
    resendKey(email),
    "1",
    "EX",
    OTP_RESEND_COOLDOWN_SECONDS,
    "NX"
  );
  if (acquired === null) throw serviceError(CODES.RESEND_COOLDOWN);

  const otpCode = generateOtp();
  const updated = { ...data, otp_hash: hashOtp(otpCode) };

  const execResult = await redisClient
    .multi()
    .set(verifyKey(email), JSON.stringify(updated), "EX", OTP_TTL_SECONDS)
    .del(attemptsKey(email))
    .exec();

  if (execResult.some(([err]) => err)) {
    await redisClient.del(resendKey(email)).catch(() => {});
    throw serviceError(CODES.INTERNAL);
  }

  try {
    // await sendEmail(email, "Email Verification", returnHTML(otpCode));
    console.log("OTP code resent successfully: ", otpCode);
  } catch (cause) {
    await redisClient.del(resendKey(email)).catch(() => {});
    throw serviceError(CODES.EMAIL_SEND_FAILED, cause);
  }
}

async function logout(user_id, refreshTokenHash) {
  await redisClient.multi()
    .del(`refresh:${refreshTokenHash}`)
    .srem(`refresh:user:${user_id}`, refreshTokenHash)
    .exec();
}

module.exports = { startSignup, authenticate, verifyOtp, resendOtp, logout };
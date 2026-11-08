const jwt = require("jsonwebtoken");
const config = require("../config/config");
const crypto = require("crypto");
const redisClient = require("../config/redis")

async function generateAccessToken(payload) {
  const accessToken = jwt.sign(
    payload,
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTTLSeconds, algorithm: "HS256" }
  );

  return accessToken;
}

async function generateRefreshToken(payload) {
  const refreshToken = crypto.randomBytes(32).toString("base64url");

  const refreshHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("base64url");

  await redisClient.set(
    `refresh:${refreshHash}`,
    JSON.stringify({ ...payload, createdAt: Date.now() }),
    "EX",
    config.jwt.refreshTTLSeconds
  );

  // optional: for logout all devices
  await redisClient.sadd(`refresh:user:${payload.user_id}`, refreshHash);

  return refreshToken;
}

module.exports = { generateAccessToken, generateRefreshToken };
module.exports = {
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  accessTTLSeconds: process.env.JWT_ACCESS_TTL_SECONDS,
  refreshTTLSeconds: process.env.JWT_REFRESH_TTL_SECONDS
}
const Redis = require("ioredis");
const config = require("./config");

const redisClient = new Redis(config.redis.redisUrl);

module.exports = redisClient;
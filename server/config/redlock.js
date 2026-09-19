const { default: Redlock } = require("redlock");
const redisClient = require("./redis");

const redlock = new Redlock([redisClient], {
  retryCount: 3,
  retryDelay: 200,
  retryJitter: 100,
});

redlock.on("clientError", (err) => {
  console.error("Redlock client error:", err);
});

module.exports = redlock;

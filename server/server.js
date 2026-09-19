const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const cors = require("cors");
const morganMiddleware = require("./middleware/morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { checkSessionExpiry } = require("./middleware/checkSessionExpiry");
const requestQueryCacheMiddleware = require("./middleware/requestQueryCache");
const { excludeRoutes } = require("./middleware/middlewareHelper");
const initializeCron = require("./cron/scheduler");
const { excludedPaths } = require("./config/constants");
const redisClient = require("./config/redis");
const { APP_API_PORT } = require("./config/config");
const { Queue } = require("bullmq");
const emailService = require("./services/email");

const app = express();
const server = http.createServer(app);

// app.set("trust proxy", true);
app.use(cors());
app.use(bodyParser.json({ extended: true, limit: "150mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Morgan setup
app.use(morganMiddleware);

// Rate limiting (tunable for Atlas Flex / abuse protection; default is conservative)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

connectDB();

// Verify Redis connection
redisClient
  .ping()
  .then(() => {
    console.log("Redis connection verified");

    // Initialize cron after Redis connection
    initializeCron();
  })
  .catch((err) => console.error("Redis connection error:", err));

// Verify Brevo API connection on startup (fail fast if unreachable)
// Uses HTTPS (port 443) - no SMTP port blocking issues on DigitalOcean
emailService
  .verifyConnection()
  .then((accountInfo) => {
    console.log("📧 Brevo API connection verified and ready");
    if (accountInfo.email) {
      console.log(`📧 Account: ${accountInfo.email}`);
    }
  })
  .catch((err) => {
    // Error handling is done in brevoClient - just log here
    console.error("⚠️  Brevo API verification failed:", err.message);
    console.error(
      "⚠️  Email sending may not work. Check BREVO_API_KEY environment variable."
    );
    // Don't crash server - allow app to start even if email service is misconfigured
  });

// Process Jobs
const workers = require("./queueSystem/queueFactories/queueWorkers");

// Per-request dedupe cache for identical DB reads (e.g. settings) within one HTTP request
app.use(requestQueryCacheMiddleware);

// Apply the checkSessionExpiry middleware to all routes except the excluded paths
app.use(excludeRoutes(checkSessionExpiry, excludedPaths));

// Routes
app.use(require("./routes"));

const validationError = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    // Validation error occurred
    const errors = Object.values(err.errors).map((error) => error.message);
    return res
      .status(400)
      .json({ error: "Validation error", messages: errors });
  }
  next(err);
};

const errorHandler = (err, req, res, next) => {
  // Handle the error and send an appropriate response
  console.log(err, "err");
  res.status(500).json({ error: err.message });
};

app.use("/", validationError);
app.use("/", errorHandler);

const port = APP_API_PORT || 5000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

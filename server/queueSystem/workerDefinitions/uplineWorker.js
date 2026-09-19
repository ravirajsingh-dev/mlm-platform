const mongoose = require("mongoose");
const {
  updateUserUpline,
  updateUserUplineAndSponsor,
} = require("../../utils/paymentDistributionService");
const { retryOperation } = require("../../utils/dbHelpers");

// Enhanced logger
const logger = {
  info: (...args) =>
    console.log(`[${new Date().toISOString()}] INFO:`, ...args),
  error: (...args) =>
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args),
  warn: (...args) =>
    console.warn(`[${new Date().toISOString()}] WARN:`, ...args),
};

// Handles upgrade payment initiation from user side
const updateUplineTask = async (job) => {
  const startTime = Date.now();
  const { user } = job?.data || {};

  if (!user) {
    logger.error(`Missing user in job data for job ${job.id}`);
    throw new Error("Missing user in job data");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await retryOperation(
        async () => {
          await updateUserUplineAndSponsor(user, session);
        },
        3,
        100
      );
    });

    const duration = Date.now() - startTime;

    logger.info(`✅ Upline updated for user: ${user} in ${duration}ms`);

    return {
      success: true,
      user,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      `❌ Job ${job.id} failed for user ${user} after ${duration}ms: ${error.message}`
    );

    if (error.message?.toLowerCase().includes("insufficient funds")) {
      return {
        success: false,
        error: "Insufficient funds",
        user,
        durationMs: duration,
      };
    }

    throw {
      ...error,
      jobId: job.id,
      user,
      durationMs: duration,
    };
  } finally {
    await session.endSession();
  }
};

// Route job to proper handler
const handleUplineJob = async (job) => {
  logger.info(`📬 Received Upline job: ${job.name} | ID: ${job.id}`);

  try {
    switch (job.name) {
      case "updateUpline":
        return await updateUplineTask(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  } catch (error) {
    logger.error(`❌ Error in job ${job.id}:`, error);
    throw error;
  }
};

module.exports = { handleUplineJob };

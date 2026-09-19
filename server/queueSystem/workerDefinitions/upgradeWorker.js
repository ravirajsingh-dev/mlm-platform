const mongoose = require("mongoose");
const { retryOperation } = require("../../utils/dbHelpers");
const {
  processPendingPaymentLinks,
  upgradePaymentProcessing,
  handlePendingLinksForUser,
} = require("../../utils/paymentDistributionService");
const {
  transferToCommunityDDF,
  deactiveUnpaidAndPaymentLinks,
} = require("../../utils/ddfCronHelper");

// Enhanced logger
const logger = {
  info: (...args) =>
    console.log(`[${new Date().toISOString()}] INFO:`, ...args),
  error: (...args) =>
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args),
  warn: (...args) =>
    console.warn(`[${new Date().toISOString()}] WARN:`, ...args),
};

// Handles payments already queued for upgrade
const processUpgradePaymentTask = async (job) => {
  const startTime = Date.now();
  const receiverData = job?.data;

  if (!receiverData?._id || !receiverData?.EP_ID) {
    logger.error(`Invalid job payload: ${JSON.stringify(job?.data)}`);
    throw new Error("Invalid receiver data in job payload");
  }

  logger.info(`Job ${job.id} - Processing upgrade for: ${receiverData.EP_ID}`);

  try {
    await retryOperation(
      async () => {
        logger.info(`Transaction start for ${receiverData.EP_ID}`);
        await handlePendingLinksForUser(receiverData);
        logger.info(`Payments processed for ${receiverData.EP_ID}`);
      },
      5,
      300
    );

    const duration = Date.now() - startTime;
    logger.info(`Job ${job.id} completed in ${duration}ms`);

    return {
      success: true,
      receiverId: receiverData.EP_ID,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `Job ${job.id} failed for ${receiverData.EP_ID} in ${duration}ms: ${error.message}`
    );

    if (error.message?.toLowerCase().includes("insufficient funds")) {
      return {
        success: false,
        error: "Insufficient funds",
        durationMs: duration,
      };
    }

    throw {
      ...error,
      jobId: job.id,
      receiverId: receiverData.EP_ID,
      durationMs: duration,
    };
  }
};

// Handles upgrade payment initiation from user side
const upgradePaymentProcessingTask = async (job) => {
  const startTime = Date.now();
  const { user, nextLevelDetails, req, processedPaymentLinks } =
    job?.data || {};

  if (!user?.EP_ID) {
    logger.error(`Invalid user data in job: ${JSON.stringify(job?.data)}`);
    throw new Error("Invalid user data");
  }

  logger.info(
    `Job ${job.id} - Starting upgrade process for user ${user.EP_ID}`
  );

  try {
    await retryOperation(
      async () => {
        logger.info(`[${user.EP_ID}] Processing upgrade...`);
        const receiver = await upgradePaymentProcessing(
          user,
          nextLevelDetails,
          req,
          processedPaymentLinks
        );
      },
      5,
      300
    );

    const duration = Date.now() - startTime;
    logger.info(`[${user.EP_ID}] Job ${job.id} completed in ${duration}ms`);

    return {
      success: true,
      userId: user.EP_ID,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      `Job ${job.id} failed for user ${user.EP_ID} after ${duration}ms: ${error.message}`
    );

    if (error.message?.toLowerCase().includes("insufficient funds")) {
      return {
        success: false,
        error: "Insufficient funds",
        userId: user.EP_ID,
        durationMs: duration,
      };
    }

    throw {
      ...error,
      jobId: job.id,
      userId: user.EP_ID,
      durationMs: duration,
    };
  }
};

// Handles payments already queued for upgrade
const processCronJobTask = async (job) => {
  try {
    await retryOperation(
      async () => {
        logger.info(`Cron Job start for DDF`);
        await transferToCommunityDDF();
        logger.info(`Cron job processed for DDF`);
      },
      5,
      300
    );

    return {
      success: true,
    };
  } catch (error) {
    throw {
      ...error,
      jobId: job.id,
    };
  }
};

// Route job to proper handler
const handleUpgradePaymentProcessingJob = async (job) => {
  logger.info(`Received job: ${job.name} | ID: ${job.id}`);

  try {
    switch (job.name) {
      case "upgradePaymentProcessingTask":
        return await upgradePaymentProcessingTask(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  } catch (error) {
    logger.error(`Error in job ${job.id}:`, error);
    throw error;
  }
};

// Route job to process upgrade payment
const handleUpgradePaymentJob = async (job) => {
  logger.info(`Received job: ${job.name} | ID: ${job.id}`);

  try {
    switch (job.name) {
      case "sendUpgradePayment":
        return await processUpgradePaymentTask(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  } catch (error) {
    logger.error(`Error in job ${job.id}:`, error);
    throw error;
  }
};

// Route job to proper handler
const handleCornJobs = async (job) => {
  logger.info(`Received job: ${job.name} | ID: ${job.id}`);

  try {
    switch (job.name) {
      case "cornjobs":
        return await processCronJobTask(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  } catch (error) {
    logger.error(`Error in job ${job.id}:`, error);
    throw error;
  }
};

// Handles payments already queued for upgrade
const processDeactiveUnpaidCronJobTask = async (job) => {
  try {
    await retryOperation(
      async () => {
        logger.info(`Cron Job start for Deactive Unpaid Users`);
        await deactiveUnpaidAndPaymentLinks();
        logger.info(`Cron job processed for Deactive Unpaid Users`);
      },
      5,
      300
    );

    return {
      success: true,
    };
  } catch (error) {
    throw {
      ...error,
      jobId: job.id,
    };
  }
};

// Route job to proper handler
const handleDeactiveUnpaidCornJobs = async (job) => {
  logger.info(`Received job: ${job.name} | ID: ${job.id}`);

  try {
    switch (job.name) {
      case "deactiveUnpaid":
        return await processDeactiveUnpaidCronJobTask(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  } catch (error) {
    logger.error(`Error in job ${job.id}:`, error);
    throw error;
  }
};

module.exports = {
  handleUpgradePaymentJob,
  handleUpgradePaymentProcessingJob,
  handleCornJobs,
  handleDeactiveUnpaidCornJobs,
};

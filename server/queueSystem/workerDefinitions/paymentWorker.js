const mongoose = require("mongoose");
const { retryOperation } = require("../../utils/dbHelpers");
const {
  processPendingPaymentLinksForSender,
} = require("../../utils/paymentDistributionService");

// Enhanced logger
const logger = {
  info: (...args) =>
    console.log(`[${new Date().toISOString()}] INFO:`, ...args),
  error: (...args) =>
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args),
  warn: (...args) =>
    console.warn(`[${new Date().toISOString()}] WARN:`, ...args),
};

const processPendingPayments = async (job) => {
  const startTime = Date.now();
  const receiver = job.data;

  console.log("receiver", receiver.name);

  if (!receiver || !receiver._id || !receiver.EP_ID) {
    logger.error(`Invalid job data: ${JSON.stringify(job.data)}`);
    throw new Error("Invalid receiver data in job payload");
  }

  logger.info(`Processing payments for ${receiver.EP_ID} (Job ID: ${job.id})`);

  try {
    await retryOperation(
      async () => {
        logger.info(`Starting transaction for ${receiver.EP_ID}`);
        await processPendingPaymentLinksForSender(receiver);
        logger.info(`Completed processing for ${receiver.EP_ID}`);
      },
      5,
      300
    );

    const duration = Date.now() - startTime;
    logger.info(`Finished processing ${receiver.EP_ID} in ${duration}ms`);
    return {
      success: true,
      receiverId: receiver.EP_ID,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `Job ${job.id} for ${receiver.EP_ID} failed after ${duration}ms`,
      error.message,
      error.stack
    );

    if (error.message.includes("insufficient funds")) {
      return {
        success: false,
        error: "Insufficient funds",
        durationMs: duration,
      };
    }

    error.jobId = job.id;
    error.receiverId = receiver.EP_ID;
    error.durationMs = duration;
    throw error;
  }
};

const handlePaymentJob = async (job) => {
  console.log(`Received job: ${job.name} | ID: ${job.id}`);
  console.log(`Received job:`, job.data);
  try {
    switch (job.name) {
      case "sendPayment":
        return await processPendingPayments(job);
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  } catch (error) {
    logger.error(`Job ${job.id} failed`, error);
    throw error;
  }
};

module.exports = { handlePaymentJob };

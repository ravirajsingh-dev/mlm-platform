const { Worker } = require("bullmq");
const redisClient = require("../../config/redis");
const { handlePaymentJob } = require("../workerDefinitions/paymentWorker");
const {
  register,
} = require("../../routes/Auth/Controllers/RegisterController");
const {
  handleUpgradePaymentJob,
  handleUpgradePaymentProcessingJob,
  handleCornJobs,
  handleDeactiveUnpaidCornJobs,
} = require("../workerDefinitions/upgradeWorker");

const { handleUplineJob } = require("../workerDefinitions/uplineWorker");
const { handleEPoolJob } = require("../workerDefinitions/ePoolWorker");

const logger = {
  info: (...args) =>
    console.log(`[${new Date().toISOString()}] INFO:`, ...args),
  error: (...args) =>
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args),
  warn: (...args) =>
    console.warn(`[${new Date().toISOString()}] WARN:`, ...args),
};

// Must match queueService.js - Queue uses PROJECT_NAMESPACE || "ekpahal"
const QUEUE_PREFIX = process.env.PROJECT_NAMESPACE || "ekpahal";

const workerConcurrency =
  Number.isFinite(Number(process.env.BULLMQ_WORKER_CONCURRENCY)) &&
  Number(process.env.BULLMQ_WORKER_CONCURRENCY) > 0
    ? Number(process.env.BULLMQ_WORKER_CONCURRENCY)
    : 2;

// Generic Worker Factory Function
const createWorker = (queueName, processor) => {
  const worker = new Worker(queueName, processor, {
    connection: redisClient,
    prefix: QUEUE_PREFIX,
    concurrency: workerConcurrency,
  });

  worker.on("completed", (job, returnvalue) => {
    logger.info(
      `✅ Job ${job.id} completed successfully in ${queueName}`,
      // returnvalue
    );
  });

  worker.on("failed", (job, err) => {
    logger.error(`❌ Job ${job?.id} failed in ${queueName}:`, err.message);
  });

  return worker;
};

// Job Processors
const paymentProcessor = async (job) => {
  logger.info(`💰 Processing payment job: ${job.id}`);
  await handlePaymentJob(job);
  return { success: true, message: "Payment processed successfully" };
};

//Upgrade Processors
const upgradeProcessor = async (job) => {
  logger.info(`Processing upgrade payment job: ${job.id}`);
  await handleUpgradePaymentJob(job);
  return { success: true, message: "Payment processed successfully" };
};

const upgradePaymentProcessingProcessor = async (job) => {
  logger.info(`Processing upgrade payment job: ${job.id}`);
  await handleUpgradePaymentProcessingJob(job);
  return { success: true, message: "Payment processed successfully" };
};

// Registration Processor
const registrationProcessor = async (job) => {
  logger.info(`👤 Processing registration job: ${job.id}`);
  const { reqData } = job.data;

  try {
    const response = await register({ body: reqData });
    logger.info(`✅ Registration completed for user: ${reqData.name}`);

    // Make sure to return the response so it's passed back through the queue
    return response;
  } catch (error) {
    logger.error(`❌ Registration failed for user: ${reqData.name}`, error);
    throw error;
  }
};

const uplineProcessor = async (job) => {
  logger.info(`🌿 Processing upline update job: ${job.id}`);
  await handleUplineJob(job);
  return { success: true, message: "Upline updated" };
};

const systemStatusProcessor = async (job) => {
  logger.info(`DDF Jobs: ${job.data.message}`);
  await handleCornJobs(job);
  return { status: "healthy", ...job.data };
};

const deactiveUnpaidProcessor = async (job) => {
  logger.info(`DDF Jobs: ${job.data.message}`);
  await handleDeactiveUnpaidCornJobs(job);
  return { status: "healthy", ...job.data };
};

const ePoolProcessor = async (job) => {
  logger.info(`🌀 Processing E-Pool job: ${job.id}`);
  await handleEPoolJob(job);
  return { success: true };
};

// Create Workers
const workers = {
  registerWorker: createWorker("userRegistrationQueue", registrationProcessor),
  paymentWorker: createWorker("paymentProcessingQueue", paymentProcessor),
  upgradeWorker: createWorker("upgradeProcessingQueue", upgradeProcessor),
  upgradePaymentProcessing: createWorker(
    "upgradePaymentProcessingQueue",
    upgradePaymentProcessingProcessor,
  ),
  uplineWorker: createWorker("uplineUpdateQueue", uplineProcessor),
  systemStatusWorker: createWorker("systemStatusQueue", systemStatusProcessor),
  deactiveUnpaidWorker: createWorker(
    "deactiveUnpaidQueue",
    deactiveUnpaidProcessor,
  ),
  ePoolWorker: createWorker("ePoolProcessingQueue", ePoolProcessor),
};

module.exports = workers;

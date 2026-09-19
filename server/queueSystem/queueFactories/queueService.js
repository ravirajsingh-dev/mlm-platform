const { Queue, QueueEvents } = require("bullmq");
const redisClient = require("../../config/redis");

const PROJECT_NAMESPACE = process.env.PROJECT_NAMESPACE || "ekpahal";

// Queue Factory
const createQueue = (name) =>
  new Queue(name, {
    connection: redisClient,
    prefix: PROJECT_NAMESPACE,
  });

// QueueEvents Factory
const createQueueEvents = (name) =>
  new QueueEvents(name, {
    connection: redisClient,
    prefix: PROJECT_NAMESPACE,
  });

// Define Queues
const queues = {
  userRegistration: createQueue("userRegistrationQueue"),
  paymentProcessing: createQueue("paymentProcessingQueue"),
  upgradeProcessing: createQueue("upgradeProcessingQueue"),
  upgradePaymentProcessing: createQueue("upgradePaymentProcessingQueue"),
  uplineUpdate: createQueue("uplineUpdateQueue"),
  systemStatus: createQueue("systemStatusQueue"),
  deactiveUnpaid: createQueue("deactiveUnpaidQueue"),
  ePoolProcessing: createQueue("ePoolProcessingQueue"),
};

// Define QueueEvents
const queueEvents = {
  userRegistration: createQueueEvents("userRegistrationQueue"),
  paymentProcessing: createQueueEvents("paymentProcessingQueue"),
  upgradeProcessing: createQueueEvents("upgradeProcessingQueue"),
  upgradePaymentProcessing: createQueueEvents("upgradePaymentProcessingQueue"),
  uplineUpdate: createQueueEvents("uplineUpdateQueue"),
  systemStatus: createQueueEvents("systemStatusQueue"),
  deactiveUnpaid: createQueueEvents("deactiveUnpaidQueue"),
  ePoolProcessing: createQueueEvents("ePoolProcessingQueue"),
};

// Dynamic function to wait for a job's completion or failure
const waitForJobCompletion = (queueName, jobID) => {
  return new Promise((resolve, reject) => {
    if (!queueEvents[queueName]) {
      return reject(new Error(`QueueEvents for ${queueName} does not exist`));
    }

    const queueEvent = queueEvents[queueName];

    const onComplete = ({ jobId, returnvalue }) => {
      if (String(jobID) === String(jobId)) {
        cleanup();
        resolve(returnvalue);
      }
    };

    const onFail = ({ jobId, failedReason }) => {
      if (String(jobID) === String(jobId)) {
        cleanup();
        reject(failedReason);
      }
    };

    const cleanup = () => {
      queueEvent.off("completed", onComplete);
      queueEvent.off("failed", onFail);
    };

    queueEvent.on("completed", onComplete);
    queueEvent.on("failed", onFail);
  });
};

// Add Job to Queue and Await Completion
const addJob = async (queueName, jobName, jobData) => {
  if (!queues[queueName]) {
    console.log("addJob 11");
    throw new Error(`Queue ${queueName} does not exist`);
  }

  try {
    console.log("addJob 22");
    const job = await queues[queueName].add(jobName, jobData);
    console.log(`✅ Job added to ${queueName} | ID: ${job.id}`);

    const result = await waitForJobCompletion(queueName, job.id);
    // console.log(`✅ Job ${job.id} completed with result:`, result);

    return result;
  } catch (error) {
    console.error(`❌ Error adding job to ${queueName}:`, error);
    throw error;
  }
};

module.exports = {
  queues,
  queueEvents,
  addJob,
  createQueue,
  createQueueEvents,
};

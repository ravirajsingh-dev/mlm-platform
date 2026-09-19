const { CronJob } = require("cron");
const { logger } = require("../helpers/cronHelper");
const { addJob } = require("../../queueSystem/queueFactories/queueService");

const setupCronJob = () => {
  // Separate cron schedules for different jobs
  const jobSchedules = {
    systemCheck: "5 1 * * *", // Daily 01:05 UTC (staggered vs other crons)
    deactivateUnpaid: "10 3 * * *", // Daily 03:10 UTC
  };

  // Validate cron patterns
  const validateCronPattern = (pattern) => {
    const cronRegex =
      /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(pattern);
  };

  // Initialize system check job
  const systemCheckJob = new CronJob(
    jobSchedules.systemCheck,
    () => {
      logger.info(`[System Check] Running at ${new Date().toISOString()}`);
      addJob("systemStatus", "cornjobs", {
        timestamp: Date.now(),
        message: "System health check",
      });
    },
    null,
    true,
    "UTC"
  );

  // Initialize deactivation job
  const deactivationJob = new CronJob(
    jobSchedules.deactivateUnpaid,
    () => {
      logger.info(`[Deactivation] Running at ${new Date().toISOString()}`);

      addJob("deactiveUnpaid", "deactiveUnpaid", {
        timestamp: Date.now(),
        message: "Deactivation Unpaid users and pending payment links",
      });
    },
    null,
    true,
    "UTC"
  );

  // Validate cron patterns
  if (!validateCronPattern(jobSchedules.systemCheck)) {
    logger.error(
      `Invalid system check cron pattern: ${jobSchedules.systemCheck}`
    );
    process.exit(1);
  }

  if (!validateCronPattern(jobSchedules.deactivateUnpaid)) {
    logger.error(
      `Invalid deactivation cron pattern: ${jobSchedules.deactivateUnpaid}`
    );
    process.exit(1);
  }

  logger.info(`
    Cron Jobs Initialized:
    - System Checks: ${jobSchedules.systemCheck}
    - Deactivation: ${jobSchedules.deactivateUnpaid}
  `);

  return {
    systemCheckJob,
    deactivationJob,
    jobSchedules,
  };
};

module.exports = setupCronJob;

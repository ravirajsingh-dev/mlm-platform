const { logger } = require("./helpers/cronHelper");
const setupCronJob = require("./jobs/setupCronJob");

const initializeCron = () => {
  try {
    setupCronJob();
    logger.info("All cron jobs initialized");
  } catch (error) {
    logger.error(`Cron initialization failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = initializeCron;

const mongoose = require("mongoose");
const User = require("../../models/User");
const {
  findPendingEPoolUpgradeLink,
  processPaymentToPendingLink,
  sendPaymentToCommunity,
  generateEPoolEarningLinks,
} = require("../../utils/ePoolHelpers");

const ENTRY_AMOUNT = 500;

const handleEPoolJob = async (job) => {
  const { userId } = job.data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session).lean();
    if (!user) throw new Error("User not found");

    const pendingLink = await findPendingEPoolUpgradeLink(ENTRY_AMOUNT);

    if (pendingLink) {
      await processPaymentToPendingLink(user, pendingLink, ENTRY_AMOUNT);
    } else {
      await sendPaymentToCommunity(user, ENTRY_AMOUNT);
    }

    await generateEPoolEarningLinks(userId, 1);

    await session.commitTransaction();
    session.endSession();

    return true;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = { handleEPoolJob };

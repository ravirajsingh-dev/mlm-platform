const mongoose = require("mongoose");
const redlock = require("../config/redlock");

const Level = require("../models/Level");
const PaymentLink = require("../models/PaymentLink");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Wallet = require("../models/Wallet");

const { passive_income } = require("./constants");
const { getSetting } = require("../models/Setting");
const {
  defaultWalletTransferRatio,
  directRewardsList,
} = require("./levelUtils");
const { addJob } = require("../queueSystem/queueFactories/queueService");

const {
  assignUplineForUpgradePayment,
  assignUplineForPassivePayment,
} = require("./userAndLinkHelpers");

const {
  retryOperation,
  isUpgradePaymentComplete,
  confirmPaymentAndTransferFunds,
} = require("./dbHelpers");

const currentlyProcessingUsers = new Set();

// ====================== Payment Link Processing ======================
const processPendingPaymentLinks = async (user) => {
  const senderId = user._id.toString();

  if (currentlyProcessingUsers.has(senderId)) {
    console.log(`[SKIPPED] Already processing user ${user.EP_ID}`);
    return;
  }

  currentlyProcessingUsers.add(senderId);

  const lockKey = `lock:payment:sender:${senderId}`;
  const lockTTL = 15000;
  let lock;
  let extendInterval;

  return retryOperation(
    async () => {
      try {
        lock = await redlock.acquire([lockKey], lockTTL);
        console.log(`[LOCKED] Sender ${user.EP_ID}`);

        extendInterval = setInterval(async () => {
          try {
            lock = await lock.extend(lockTTL);
            console.log(`[LOCK EXTENDED] ${user.EP_ID}`);
          } catch (err) {
            console.error(`[EXTEND FAILED]`, err.message);
          }
        }, lockTTL / 2);

        await handlePendingLinksForUser(user);

        return true;
      } catch (error) {
        throw error;
      } finally {
        currentlyProcessingUsers.delete(senderId);
        if (extendInterval) clearInterval(extendInterval);

        if (lock) {
          try {
            await lock.release();
            console.log(`[UNLOCKED] Sender ${user.EP_ID}`);
          } catch (releaseErr) {
            console.error(`[UNLOCK FAILED]`, releaseErr.message);
          }
        }
      }
    },
    5,
    300
  );
};

const getPaymentLinkAssigner = (paymentType) => {
  switch (paymentType) {
    case "Upgrade":
      return assignUplineForUpgradePayment;
    case "Passive":
      return assignUplineForPassivePayment;
    default:
      throw new Error(`Unknown payment type: ${paymentType}`);
  }
};

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 100;

const upgradePaymentProcessing = async (user, nextLevelDetails, req) => {
  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRY_ATTEMPTS) {
    const session = await mongoose.startSession();
    let transactionCommitted = false;

    try {
      // Add small delay between retries to reduce contention
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt)
        );
      }

      // Start the transaction explicitly
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority", j: true },
        maxTimeMS: 30000,
      });

      console.log(`[Transaction STARTED] Attempt ${attempt + 1}`);

      // Use optimistic concurrency control by checking document versions
      const currentUserWallet = await Wallet.findOne({
        user: user._id,
      }).session(session);

      console.log(
        `[Upgrade Wallet] ${user.name} Wallet Upgrade Amount: ${currentUserWallet.upgrade}`
      );

      if (currentUserWallet.upgrade < req.bits) {
        console.log(
          `[SKIP] Not enough upgrade balance: ${currentUserWallet.upgrade} < ${req.bits}`
        );
        throw new Error("INSUFFICIENT_FUNDS"); // Will abort transaction
      }

      console.log(`[Assign Link] for ${req.bits_type} (${req.bits})`);

      const assignFn = getPaymentLinkAssigner(req.bits_type);

      let updatedPaymentLink;
      if (req.bits_type === "Passive") {
        updatedPaymentLink = await assignFn(user, req, false, session);
      } else {
        updatedPaymentLink = await assignFn(user, req, false, session);
      }

      if (!updatedPaymentLink) {
        console.warn(`[Error] No payment link assigned!`);
        throw new Error("PAYMENT_LINK_NOT_ASSIGNED");
      }

      console.log(
        `[Assigned Link] ========>>>>> ${user.EP_ID} (${user.name})`,
        updatedPaymentLink
      );

      const sender = await User.findById(user._id).session(session);
      const receiver = await User.findById(updatedPaymentLink.receiver).session(
        session
      );

      if (!sender || !receiver) {
        console.warn(`[Error] Sender or Receiver not found`);
        throw new Error("USER_NOT_FOUND");
      }

      console.log(`[Sender] ${sender.EP_ID} -> [Receiver] ${receiver.EP_ID}`);

      const fundsStatus = await confirmPaymentAndTransferFunds({
        sender,
        receiver,
        amount: req.bits,
        paymentLinkId: updatedPaymentLink,
        paymentType: req.bits_type,
        senderWalletType: "upgrade",
        session,
      });

      console.log("fundsStatus--->>", fundsStatus);

      const isComplete = await isUpgradePaymentComplete(
        user._id,
        nextLevelDetails.level
        // session
      );

      console.log("isComplete------->>", isComplete);

      if (isComplete) {
        const upgradeRes = await User.updateOne(
          { _id: user._id },
          { $inc: { user_level: 1 } }
          // { session }
        );

        if (upgradeRes.modifiedCount === 0) {
          throw new Error("CONCURRENT_MODIFICATION");
        }

        const upgradedUser = await User.findById(user._id);

        console.log(
          "upgradedUser user_level is ",
          upgradedUser.user_level,
          typeof upgradedUser.user_level
        );

        // if (upgradedUser.user_level === 1) {
        //   console.log(
        //     "Inside it --------------------- ",
        //     upgradedUser.user_level
        //   );

        //   const amount = 200;
        //   const description = `₹${amount} reward received from admin for adding 2 direct referrals`;

        //   await updateWalletBalance(
        //     sender._id,
        //     amount,
        //     "e_cash",
        //     "credit",
        //     description,
        //     receiver._id
        //   );
        // }
        await generateUpgradeReceiveLinks(upgradedUser, session);

        console.log(
          `[Level Upgraded] ${user.EP_ID} to Level ${nextLevelDetails.level}`
        );
      }

      // Commit the transaction if everything succeeded
      await session.commitTransaction();
      transactionCommitted = true;
      console.log(`[Transaction COMMITTED] Upgrade complete`);
      return true;
    } catch (err) {
      lastError = err;

      // Check if error is retryable
      const isRetryable =
        err.message.includes("WriteConflict") ||
        err.message.includes("Transaction") ||
        err.message.includes("CONCURRENT_MODIFICATION") ||
        err.codeName === "WriteConflict" ||
        err.code === 112;

      if (!isRetryable) {
        console.error(`[Non-retryable Error] ${err.message}`);
        break;
      }

      console.warn(
        `[Retryable Error ${attempt + 1}/${MAX_RETRY_ATTEMPTS}] ${err.message}`
      );
      attempt++;
    } finally {
      try {
        // If the transaction wasn't committed, abort it
        if (!transactionCommitted && session.inTransaction()) {
          await session.abortTransaction();
          console.log(`[Transaction ABORTED]`);
        }
      } catch (abortErr) {
        console.error(`[Error aborting transaction] ${abortErr.message}`);
      } finally {
        await session.endSession();
      }
    }
  }

  console.error(
    `[Transaction FAILED after ${attempt} attempts] ${lastError.message}`
  );
  return false;
};

const handlePendingLinksForUser = async (user) => {
  const senderId = user._id.toString();
  const lockKey = `lock:payment:sender:${senderId}`;
  const lockTTL = 15000;
  let lock;
  let extendInterval;

  if (currentlyProcessingUsers.has(senderId)) {
    console.log(`[SKIPPED] Already processing user ${user.EP_ID}`);
    return;
  }

  currentlyProcessingUsers.add(senderId);

  try {
    lock = await redlock.acquire([lockKey], lockTTL);
    console.log(`[LOCKED] Sender ${user.EP_ID}`);

    extendInterval = setInterval(async () => {
      try {
        lock = await lock.extend(lockTTL);
        console.log(`[LOCK EXTENDED] ${user.EP_ID}`);
      } catch (err) {
        console.error(`[EXTEND FAILED]`, err.message);
      }
    }, lockTTL / 2);

    console.time(`handlePendingLinksForUser-${user._id}`);
    console.log(
      `[1] Checking pending payments for user: ${user.EP_ID} (${user.name})`
    );

    const nextLevelDetails = await Level.findOne({
      level: user.user_level + 1,
    }).lean();

    if (!nextLevelDetails) {
      console.log(`[SKIPPED] No next level for user ${user.EP_ID}`);
      return;
    }

    const requiredPayments = [...nextLevelDetails.bits_for_upgrade];

    const completedLinks = await PaymentLink.find({
      sender: user._id,
      payment_for_level: nextLevelDetails.level,
      status: "completed",
    }).lean();

    const remainingPayments = [];

    for (const req of requiredPayments) {
      const index = completedLinks.findIndex(
        (link) =>
          link.payment_type === req.bits_type &&
          link.amount === req.bits &&
          link.payment_for_level === req.payment_for_level
      );

      if (index !== -1) {
        completedLinks.splice(index, 1);
        console.log(`[✔] Already paid: ${req.bits_type} | ${req.bits}`);
        continue;
      }

      remainingPayments.push(req);
    }

    if (remainingPayments.length === 0) {
      console.log(`[✔] All payments completed for user ${user.EP_ID}`);
    } else {
      console.log(
        `[→] Scheduling jobs for pending payments`,
        remainingPayments
      );

      for (const req of remainingPayments) {
        console.log(
          `Scheduling upgrade payment job for ${req.bits_type} (${req.bits})`
        );
        await addJob(
          "upgradePaymentProcessing",
          "upgradePaymentProcessingTask",
          {
            user,
            req,
            nextLevelDetails,
          }
        );
      }
    }

    console.timeEnd(`handlePendingLinksForUser-${user._id}`);

    return true;
  } catch (error) {
    console.error(
      `[ERROR] handlePendingLinksForUser failed for ${user.EP_ID}`,
      error.message
    );
    throw error;
  } finally {
    currentlyProcessingUsers.delete(senderId);

    if (extendInterval) clearInterval(extendInterval);

    if (lock) {
      try {
        await lock.release();
        console.log(`[UNLOCKED] Sender ${user.EP_ID}`);
      } catch (releaseErr) {
        console.error(`[UNLOCK FAILED]`, releaseErr.message);
      }
    }
  }
};

const processPendingPaymentLinksForSender = async (senderUser) => {
  const senderId = senderUser._id.toString();
  const lockKey = `lock:payment:sender:${senderId}`;
  const lockTTL = 15000; // Start with 15s

  let lock;
  let extendInterval;

  try {
    lock = await redlock.acquire([lockKey], lockTTL);
    console.log(`[LOCKED] Sender ${senderUser.EP_ID}`);

    // Start auto-extension loop
    extendInterval = setInterval(async () => {
      try {
        lock = await lock.extend(lockTTL);
        console.log(`[LOCK EXTENDED] ${senderUser.EP_ID}`);
      } catch (err) {
        console.error(`[EXTEND FAILED]`, err.message);
      }
    }, lockTTL / 2); // extend halfway before expiry

    // Fetch pending payment links
    const pendingPaymentLinks = await PaymentLink.find({
      sender: senderId,
      payment_for_level: senderUser.user_level,
      status: "pending",
    })
      .select("_id")
      .lean();

    if (!pendingPaymentLinks.length) {
      console.log(`[NO PENDING] for ${senderUser.EP_ID}`);
      return;
    }

    console.log(
      `[PROCESSING ${pendingPaymentLinks.length}] for ${senderUser.EP_ID}`
    );

    // Process sequentially
    for (const link of pendingPaymentLinks) {
      try {
        await processOutgoingPaymentLink(link);
      } catch (err) {
        console.error(`[FAIL] ${link._id}:`, err.message);
      }
    }
  } catch (err) {
    if (err.name === "LockError") {
      console.log(`[SKIPPED] ${senderUser.EP_ID} already processing.`);
    } else {
      console.error(`[ERROR] Processing ${senderUser.EP_ID}:`, err.message);
    }
  } finally {
    if (extendInterval) clearInterval(extendInterval); // Stop extension loop

    if (lock) {
      try {
        await lock.release();
        console.log(`[UNLOCKED] Sender ${senderUser.EP_ID}`);
      } catch (releaseErr) {
        console.error(`[UNLOCK FAILED]`, releaseErr.message);
      }
    }
  }
};

const processOutgoingPaymentLink = async (paymentLink) => {
  try {
    console.time(`ProcessPayment-${paymentLink?._id}`);
    console.log(`⏳ Processing payment: ${paymentLink?._id}`);

    if (
      !paymentLink?._id ||
      !mongoose.Types.ObjectId.isValid(paymentLink._id)
    ) {
      throw new Error("Invalid or missing paymentLink._id");
    }

    const verifiedLink = await PaymentLink.findById(paymentLink._id).select(
      "amount sender receiver payment_type payment_for_level"
    );

    const sender = await User.findById({ _id: verifiedLink.sender }).select(
      "EP_ID status name user_level sponsorEP phone"
    );

    const receiver = await User.findById({ _id: verifiedLink.receiver }).select(
      "EP_ID status name user_level is_root sponsorEP phone"
    );

    // .populate("sender", "EP_ID status name user_level")
    // .populate("receiver", "EP_ID status name user_level is_root");

    if (!verifiedLink) throw new Error("Payment link not found");

    const { amount: requiredAmount } = verifiedLink;

    if (!sender?._id || !receiver?._id) {
      throw new Error("Sender or receiver not found in payment link");
    }

    const hasBalance = await retryOperation(async () => {
      const wallet = await Wallet.findOne(
        { user: sender._id },
        { e_cash: 1 }
      ).lean();

      if (!wallet) throw new Error("Sender wallet not found");
      if (wallet.e_cash >= requiredAmount) return true;

      throw new Error(
        `Insufficient balance for ${sender.EP_ID} | Required: ${requiredAmount}, Available: ${wallet.e_cash}`
      );
    });

    if (!hasBalance) {
      throw new Error(`❌ ${sender.EP_ID} lacks funds`);
    }

    await retryOperation(async () => {
      // const session = await mongoose.startSession();
      try {
        // await session.withTransaction(async () => {
        await executePaymentTransaction(
          verifiedLink,
          sender,
          receiver
          // session
        );
        // });
      } finally {
        // session.endSession();
      }
    });

    console.timeEnd(`ProcessPayment-${paymentLink._id}`);
    console.log(`✅ Payment ${paymentLink._id} processed`);
  } catch (error) {
    console.error(`❌ Payment ${paymentLink?._id} failed:`, error.message);
    throw error;
  }
};

// ====================== Transaction Execution ======================
const executePaymentTransaction = async (
  paymentLink,
  sender,
  receiver
  // session
) => {
  // const session = await mongoose.startSession();

  // if (!session || typeof session.withTransaction !== "function") {
  //   throw new Error("Invalid MongoDB session");
  // }

  try {
    await retryOperation(async () => {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const fundStatusInExcutePT = await confirmPaymentAndTransferFunds({
            sender,
            receiver,
            amount: paymentLink.amount,
            paymentLinkId: paymentLink,
            paymentType: paymentLink.payment_type,
            senderWalletType: "e_cash",
            session,
          });

          console.log("fundStatusInExcutePT=====>>>>", fundStatusInExcutePT);

          await updateSenderData(sender, paymentLink, session);
        });
      } finally {
        session.endSession();
      }
    });

    // await session.withTransaction(async () => {
    //   await updateSenderData(sender, paymentLink, session);
    // });
  } catch (err) {
    console.error("Transaction failed:", err.message);
    throw err;
  }
};

// ====================== User Status Management ======================
const updateSenderData = async (senderData, paymentLink, session) => {
  try {
    console.log("updateSenderData is calling..........................");
    const senderId = senderData._id;
    const updateFields = {};

    let needsDirect = false;
    let needsPassive = false;
    let needsHelp = false;

    if (paymentLink.payment_type === "Direct") needsDirect = true;
    else if (paymentLink.payment_type === "Passive") needsPassive = true;
    else if (paymentLink.payment_type === "Help") needsHelp = true;

    const sender = await User.findById(senderId)
      .select("is_direct_paid is_passive_paid is_help_paid userId")
      .session(session);

    if (!sender) throw new Error("Sender not found");

    if (needsDirect && !sender.is_direct_paid) {
      updateFields.is_direct_paid = true;
    }

    if (needsHelp && !sender.is_help_paid) {
      updateFields.is_help_paid = true;
    }

    if (needsPassive && !sender.is_passive_paid) {
      const paidCount = await PaymentLink.countDocuments({
        sender: senderId,
        payment_type: "Passive",
        sender_status: "paid",
        receiver_status: "confirmed",
        status: "completed",
      }).session(session);

      if (paidCount >= 1) {
        updateFields.is_passive_paid = true;
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne(
        { _id: senderId },
        { $set: updateFields },
        { session }
      );
    }

    // Fetch fresh data (no lean) to ensure updated values
    const freshSender = await User.findById(senderId)
      .select("-passCopy -password -uuid -txnPassCopy -txn_password")
      .session(session);

    await checkUserForActivation(freshSender, session).catch((err) => {
      console.error("Activation check error:", err);
    });
  } catch (error) {
    console.error("Error updating sender data:", error);
    throw new Error("Error updating sender data.");
  }
};

const checkUserForActivation = async (user, session) => {
  try {
    if (
      user.status === 3 &&
      user.is_direct_paid &&
      user.is_passive_paid &&
      user.is_help_paid
    ) {
      await User.updateOne(
        { _id: user._id },
        { $set: { status: 1 } },
        { session }
      );

      console.log(
        `[Updated] User: ${user.name} status changed from New (3) to Active (1) | Level: ${user.user_level}`
      );

      setImmediate(async () => {
        try {
          await addJob("uplineUpdate", "updateUpline", { user });
        } catch (err) {
          console.error("Job scheduling error:", err);
        }
      });

      // await updateUserUpline(user, session);
      // await updateSponsorUser(user, session);
      // await checkPassiveEligibilityAndGenerateLink(user, session);
    }
  } catch (err) {
    console.error("Error in checkUserForActivation:", err.message);
    throw new Error("User activation check failed.");
  }
};

const isUserInSubtree = async (rootId, targetId, session) => {
  if (!rootId) return false;
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (currentId.toString() === targetId.toString()) return true;

    const currentUser = await User.findById(currentId, "left_leg right_leg", {
      session,
    }).lean();

    if (!currentUser) continue;

    if (currentUser.left_leg) queue.push(currentUser.left_leg);
    if (currentUser.right_leg) queue.push(currentUser.right_leg);
  }

  return false;
};

const findUserSideInTree = async (sponsor, targetId, session) => {
  const foundInLeft = await isUserInSubtree(
    sponsor.left_leg,
    targetId,
    session
  );
  if (foundInLeft) return "left";

  const foundInRight = await isUserInSubtree(
    sponsor.right_leg,
    targetId,
    session
  );
  if (foundInRight) return "right";

  return null;
};

const updateUserUplineAndSponsor = async (user, session) => {
  const lockTTL = 5000;
  const lockKey = `lock:updateUser:${user._id}`;
  let lock, interval;

  try {
    if (!session) throw new Error("Session is required");

    // Acquire lock
    lock = await redlock.acquire([lockKey], lockTTL);
    console.log(`[LOCKED] ${lockKey}`);

    // Start lock extension loop
    interval = setInterval(async () => {
      try {
        lock = await lock.extend(lockTTL);
        console.log(`[LOCK EXTENDED] ${lockKey}`);
      } catch (err) {
        console.warn(`[EXTEND FAILED] ${lockKey}: ${err.message}`);
      }
    }, lockTTL / 2);

    // 1. Update sponsor
    const sponsor = await User.findOne(
      { EP_ID: user.sponsorEP },
      "_id left_leg right_leg i_added_to_left i_added_to_right total_direct_users user_level",
      { session }
    );

    console.log("sponsor-----", sponsor);

    if (sponsor) {
      let isLeft = false;
      let isRight = false;

      if (sponsor.left_leg?.toString() === user._id.toString()) {
        isLeft = true;
      } else if (sponsor.right_leg?.toString() === user._id.toString()) {
        isRight = true;
      } else {
        const side = await findUserSideInTree(sponsor, user._id, session);
        if (side === "left") isLeft = true;
        else if (side === "right") isRight = true;
        else {
          console.warn(
            `⚠️ User ${user._id} not found in sponsor ${sponsor._id} subtree`
          );
        }
      }

      // ✅ Build update object
      const update = {
        $inc: { total_direct_users: 1 },
        $set: {},
      };

      if (isLeft) {
        update.$set.i_added_to_left = true;
      } else if (isRight) {
        update.$set.i_added_to_right = true;
      }

      // 🔄 Apply update
      await retryOperation(() =>
        User.updateOne({ _id: sponsor._id }, update, { session })
      );

      // 🔁 Refresh sponsor and generate rewards
      const updatedSponsor = await User.findById(
        sponsor._id,
        "_id user_level total_direct_users",
        { session }
      ).lean();

      // if (updatedSponsor) {
      //   await generateDirectRewardLinks(
      //     {
      //       _id: updatedSponsor._id,
      //       user_level: updatedSponsor.user_level,
      //       total_direct_users: updatedSponsor.total_direct_users,
      //     },
      //     session
      //   );
      // }
    }

    // 2. Update uplines recursively
    let currentUserId = user._id;
    while (currentUserId) {
      const parent = await User.findOne(
        {
          $or: [{ left_leg: currentUserId }, { right_leg: currentUserId }],
        },
        "_id left_leg right_leg",
        { session }
      );

      if (!parent) break;

      const isLeft = parent.left_leg?.toString() === currentUserId.toString();
      const updateField = isLeft ? "total_left_users" : "total_right_users";

      await retryOperation(() =>
        User.updateOne(
          { _id: parent._id },
          { $inc: { [updateField]: 1 } },
          { session }
        )
      );

      currentUserId = parent._id;
    }

    // 3. Passive income eligibility
    await retryOperation(() =>
      checkPassiveEligibilityAndGenerateLink(user, session)
    );

    console.log(`[SUCCESS] Sponsor + Upline updated for ${user.EP_ID}`);
  } catch (err) {
    console.error(
      `❌ updateUserUplineAndSponsor failed for ${user.EP_ID}: ${err.message}`
    );
    throw err;
  } finally {
    if (interval) clearInterval(interval);
    if (lock) {
      try {
        await lock.release();
        console.log(`[UNLOCKED] ${lockKey}`);
      } catch (err) {
        console.warn(`[UNLOCK FAILED] ${lockKey}: ${err.message}`);
      }
    }
  }
};

// // Main update function for sponsor
// const updateSponsorInfo = async (user, session) => {
//   // 1. Find sponsor
//   const sponsor = await User.findOne(
//     { EP_ID: user.sponsorEP },
//     "_id left_leg right_leg i_added_to_left i_added_to_right total_direct_users user_level",
//     { session }
//   );

//   console.log("sponsor-----", sponsor);

//   if (!sponsor) return;

//   let isLeft = false;
//   let isRight = false;

//   // 2. Direct child check
//   if (sponsor.left_leg?.toString() === user._id.toString()) {
//     isLeft = true;
//   } else if (sponsor.right_leg?.toString() === user._id.toString()) {
//     isRight = true;
//   } else {
//     // 3. Subtree check
//     const side = await findUserSideInTree(sponsor, user._id, session);
//     if (side === "left") isLeft = true;
//     else if (side === "right") isRight = true;
//     else {
//       console.warn(
//         `⚠️ User ${user._id} not found in sponsor ${sponsor._id} subtree`
//       );
//     }
//   }

//   // 4. Build update
//   const update = {
//     $inc: { total_direct_users: 1 },
//     $set: {},
//   };

//   if (isLeft) update.$set.i_added_to_left = true;
//   else if (isRight) update.$set.i_added_to_right = true;

//   // 5. Apply update
//   await retryOperation(() =>
//     User.updateOne({ _id: sponsor._id }, update, { session })
//   );

//   // 6. Refresh sponsor and generate rewards
//   const updatedSponsor = await User.findById(
//     sponsor._id,
//     "_id user_level total_direct_users",
//     { session }
//   ).lean();

//   if (updatedSponsor) {
//     await generateDirectRewardLinks(
//       {
//         _id: updatedSponsor._id,
//         user_level: updatedSponsor.user_level,
//         total_direct_users: updatedSponsor.total_direct_users,
//       },
//       session
//     );
//   }
// };

// ====================== User Hierarchy Management ======================
// const updateUserUplineAndSponsor = async (user, session) => {
//   const lockTTL = 5000;
//   const lockKey = `lock:updateUser:${user._id}`;
//   let lock, interval;

//   try {
//     if (!session) throw new Error("Session is required");

//     // Acquire lock
//     lock = await redlock.acquire([lockKey], lockTTL);
//     console.log(`[LOCKED] ${lockKey}`);

//     // Start lock extension loop
//     interval = setInterval(async () => {
//       try {
//         lock = await lock.extend(lockTTL);
//         console.log(`[LOCK EXTENDED] ${lockKey}`);
//       } catch (err) {
//         console.warn(`[EXTEND FAILED] ${lockKey}: ${err.message}`);
//       }
//     }, lockTTL / 2);

//     // 1. Update sponsor
//     const sponsor = await User.findOne(
//       { EP_ID: user.sponsorEP },
//       "_id left_leg i_added_to_left i_added_to_right total_direct_users user_level",
//       { session }
//     );

//     console.log("sponsor-----", sponsor);

//     if (sponsor) {
//       let isLeft = false;
//       let isRight = false;

//       if (sponsor.left_leg?.toString() === user._id.toString()) {
//         isLeft = true;
//       } else if (sponsor.right_leg?.toString() === user._id.toString()) {
//         isRight = true;
//       } else {
//         const side = await findUserSideInTree(sponsor, user._id, session);
//         if (side === "left") isLeft = true;
//         else if (side === "right") isRight = true;
//         else {
//           console.warn(
//             `⚠️ User ${user._id} not found in sponsor ${sponsor._id} subtree`
//           );
//         }
//       }

//       // ✅ Build update object clearly
//       const update = {
//         $inc: { total_direct_users: 1 },
//         $set: {},
//       };

//       if (isLeft) {
//         update.$set.i_added_to_left = true;
//       } else if (isRight) {
//         update.$set.i_added_to_right = true;
//       }

//       // 🔄 Apply update
//       await retryOperation(() =>
//         User.updateOne({ _id: sponsor._id }, update, { session })
//       );

//       // 🔁 Refresh sponsor and generate reward
//       const updatedSponsor = await User.findById(
//         sponsor._id,
//         "_id user_level total_direct_users",
//         { session }
//       ).lean();

//       if (updatedSponsor) {
//         await generateDirectRewardLinks(
//           {
//             _id: updatedSponsor._id,
//             user_level: updatedSponsor.user_level,
//             total_direct_users: updatedSponsor.total_direct_users,
//           },
//           session
//         );
//       }
//     }

//     // 2. Update uplines
//     let currentUserId = user._id;
//     while (currentUserId) {
//       const parent = await User.findOne(
//         {
//           $or: [{ left_leg: currentUserId }, { right_leg: currentUserId }],
//         },
//         "_id left_leg right_leg",
//         { session }
//       );

//       if (!parent) break;

//       const isLeft = parent.left_leg?.toString() === currentUserId.toString();
//       const updateField = isLeft ? "total_left_users" : "total_right_users";

//       await retryOperation(() =>
//         User.updateOne(
//           { _id: parent._id },
//           { $inc: { [updateField]: 1 } },
//           { session }
//         )
//       );

//       currentUserId = parent._id;
//     }

//     // 3. Passive income eligibility
//     await retryOperation(() =>
//       checkPassiveEligibilityAndGenerateLink(user, session)
//     );

//     console.log(`[SUCCESS] Sponsor + Upline updated for ${user.EP_ID}`);
//   } catch (err) {
//     console.error(
//       `❌ updateUserUplineAndSponsor failed for ${user.EP_ID}: ${err.message}`
//     );
//     throw err;
//   } finally {
//     if (interval) clearInterval(interval);
//     if (lock) {
//       try {
//         await lock.release();
//         console.log(`[UNLOCKED] ${lockKey}`);
//       } catch (err) {
//         console.warn(`[UNLOCK FAILED] ${lockKey}: ${err.message}`);
//       }
//     }
//   }
// };

const updateUserUpline = async (newUserId, session) => {
  try {
    console.log("newUserId", newUserId);
    let currentUserId = newUserId;

    // Validate if session is provided
    if (!session) {
      throw new Error("Session is required for updating upline");
    }

    while (currentUserId) {
      const parentUser = await User.findOne(
        {
          $or: [{ left_leg: currentUserId }, { right_leg: currentUserId }],
        },
        "_id left_leg right_leg",
        { session }
      );

      if (!parentUser) break;

      const isLeft =
        parentUser.left_leg?.toString() === currentUserId.toString();
      const updateField = isLeft ? "total_left_users" : "total_right_users";

      // Perform the update with session
      const updateResult = await User.updateOne(
        { _id: parentUser._id },
        { $inc: { [updateField]: 1 } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        console.warn(`[SKIPPED] Upline not updated for ${parentUser._id}`);
      }

      // Move to the parent of the current user
      currentUserId = parentUser._id;
    }

    console.log(`[SUCCESS] Upline updated for ${newUserId}`);
  } catch (err) {
    console.error(`Upline update failed for ${newUserId}:`, err.message);
    throw new Error("Upline update failed");
  }
};

const updateSponsorUser = async (user, session) => {
  try {
    const sponsor = await User.findOne(
      { EP_ID: user.sponsorEP },
      {
        _id: 1,
        left_leg: 1,
        i_added_to_left: 1,
        i_added_to_right: 1,
        total_direct_users: 1,
      },
      { session }
    );

    if (!sponsor) {
      console.warn(`Sponsor not found for user ${user._id}`);
      return;
    }

    const userIdStr = user._id.toString();
    const leftLegStr = sponsor.left_leg?.toString();

    const userPosition = leftLegStr === userIdStr ? "left" : "right";
    const updateFields = { $inc: { total_direct_users: 1 } };

    if (userPosition === "left" && !sponsor.i_added_to_left) {
      updateFields.i_added_to_left = true;
    } else if (userPosition === "right" && !sponsor.i_added_to_right) {
      updateFields.i_added_to_right = true;
    }

    await User.updateOne({ _id: sponsor._id }, updateFields, { session });
  } catch (err) {
    console.error("Error updating sponsor user:", err);
  }
};

const checkPassiveEligibilityAndGenerateLink = async (newUser, session) => {
  try {
    let currentUser = newUser;

    while (currentUser) {
      // Find the immediate upline
      const parent = await User.findOne(
        {
          $or: [{ left_leg: currentUser._id }, { right_leg: currentUser._id }],
        },
        null,
        { session }
      );

      if (!parent) break;

      const {
        _id: parentId,
        i_added_to_left,
        i_added_to_right,
        total_left_users = 0,
        total_right_users = 0,
        ratio_completed = 0,
        EP_ID,
        name,
        user_level,
      } = parent;

      const isRatioDone = await isRatioComplete(
        total_left_users,
        total_right_users,
        ratio_completed
      );

      // Check eligibility conditions
      if (i_added_to_left && i_added_to_right && isRatioDone) {
        const newRatioToBeGenerated = Math.min(
          total_left_users,
          total_right_users
        );

        console.log(`Eligible for passive income: ${EP_ID} (${name})`);

        // Generate passive income link
        await createPaymentLink(
          parentId,
          null,
          passive_income,
          "Passive",
          user_level,
          session
        );

        // Update ratio_completed properly inside transaction
        await User.updateOne(
          { _id: parentId },
          { $set: { ratio_completed: newRatioToBeGenerated } },
          { session }
        );

        console.log(
          `Updated ratio_completed to ${newRatioToBeGenerated} for ${EP_ID} (${name})`
        );
      }

      currentUser = parent;
    }
  } catch (error) {
    console.error("🚨 Error in passive eligibility check:", error.message);
    throw error;
  }
};

// ====================== Payment Link Utilities ======================
const createPaymentLink = async (
  receiverId,
  senderId,
  amount,
  payment_type,
  payment_for_level = null,
  session = null
) => {
  try {
    const [paymentLinkDoc] = await PaymentLink.insertMany(
      [
        {
          receiver: receiverId,
          sender: senderId,
          amount,
          payment_type,
          payment_for_level,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      session ? { session } : {}
    );

    return { paymentLinkId: paymentLinkDoc._id };
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error;
  }
};

// ====================== Transaction Utilities ======================
const isRatioComplete = async (left, right, ratio_completed) => {
  try {
    const ratioList = await getSetting("ratio_list");

    const minValue = Math.min(left, right);
    if (minValue > ratio_completed) {
      const isValidRatio = ratioList?.includes(minValue);

      return isValidRatio;
    }
    return false;
  } catch (error) {
    console.error("Error fetching ratio_list:", error);
    return false;
  }
};

const generateUpgradeReceiveLinks = async (receiver, session) => {
  if (!receiver?._id || typeof receiver.user_level !== "number") {
    throw new Error("Invalid receiver object");
  }

  try {
    // Fetch level details in one query using session
    const level = await Level.findOne({ level: receiver.user_level })
      .select("earnings_on_upgrade")
      .session(session)
      .lean();

    if (!level?.earnings_on_upgrade) {
      throw new Error(
        `No upgrade benefits configured for level ${receiver.user_level}`
      );
    }

    const { deals_count, deal_bits, bits_type, payment_for_level } =
      level.earnings_on_upgrade;

    // Validate all necessary fields
    if (
      !deals_count ||
      deals_count <= 0 ||
      !deal_bits ||
      deal_bits <= 0 ||
      !["Direct", "Passive", "Upgrade", "Help"].includes(bits_type) ||
      !payment_for_level ||
      payment_for_level <= 0
    ) {
      throw new Error(
        `Invalid upgrade details for level ${receiver.user_level}`
      );
    }

    // Generate upgrade links
    const links = Array.from({ length: deals_count }, () => ({
      receiver: receiver._id,
      sender: null,
      amount: deal_bits,
      payment_type: bits_type,
      payment_for_level,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Bulk insert with session
    await PaymentLink.insertMany(links, { session });

    console.log(
      `Created ${deals_count} upgrade links for user ${receiver._id}`
    );
  } catch (error) {
    console.error("Failed to generate upgrade links:", {
      userId: receiver._id,
      error: error.message,
    });
    throw error;
  }
};

const generateDirectRewardLinks = async (receiver, session) => {
  if (
    !receiver?._id ||
    typeof receiver.user_level !== "number" ||
    typeof receiver.total_direct_users !== "number"
  ) {
    return; // Silent exit for invalid receiver
  }

  try {
    const userTotalDirect = receiver.total_direct_users;
    const userLevel = receiver.user_level;

    // Find matching configuration or exit quietly
    const directReward = directRewardsList.find(
      (d) => d.totalDirect === userTotalDirect
    );
    if (!directReward) {
      console.log(
        `No reward config for ${userTotalDirect} directs. Silent exit.`
      );
      return;
    }

    // Determine eligible levels
    const maxRewardLevel = 3;
    const levelsToProcess = Math.min(userLevel, maxRewardLevel);
    const applicableEarnings = directReward.earningsAfterUpgrade.slice(
      0,
      levelsToProcess
    );

    if (applicableEarnings.length === 0) {
      console.log(
        `No applicable earnings for level ${userLevel}. Silent exit.`
      );
      return;
    }

    // Prepare search criteria
    const criteriaList = applicableEarnings.map(({ generateEarningLinks }) => ({
      payment_type: generateEarningLinks.payment_type,
      amount: generateEarningLinks.amount,
    }));

    // Get existing counts
    const existingCounts = await PaymentLink.aggregate([
      {
        $match: {
          receiver: receiver._id,
          $or: criteriaList.map((criteria) => ({
            payment_type: criteria.payment_type,
            amount: criteria.amount,
          })),
        },
      },
      {
        $group: {
          _id: {
            payment_type: "$payment_type",
            amount: "$amount",
          },
          count: { $sum: 1 },
        },
      },
    ]).session(session);

    // Create count map
    const countMap = new Map();
    existingCounts.forEach(({ _id, count }) => {
      countMap.set(`${_id.payment_type}-${_id.amount}`, count);
    });

    // Generate missing links
    const links = applicableEarnings.flatMap(
      ({ transactionsCount, generateEarningLinks }) => {
        const { amount, payment_type, payment_for_level, linkType } =
          generateEarningLinks;

        // Silent validation failure
        if (
          !transactionsCount ||
          transactionsCount <= 0 ||
          !amount ||
          amount <= 0 ||
          !["Direct", "Passive", "Upgrade", "Help"].includes(payment_type) ||
          !payment_for_level ||
          payment_for_level <= 0
        ) {
          console.error(`Invalid config for level ${payment_for_level}`);
          return [];
        }

        // Calculate needed links
        const key = `${payment_type}-${amount}`;
        const existing = countMap.get(key) || 0;
        const needed = Math.max(transactionsCount - existing, 0);

        if (needed === 0) return [];

        return Array.from({ length: needed }, () => ({
          receiver: receiver._id,
          sender: null,
          amount,
          payment_type,
          payment_for_level,
          linkType,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
    );

    // Silent insert
    if (links.length > 0) {
      await PaymentLink.insertMany(links, { session });
      console.log(`Generated ${links.length} links for ${receiver._id}`);
    }
  } catch (error) {
    console.error("Silent failure in reward links:", {
      userId: receiver._id,
      error: error.message,
    });
    // No re-throw to maintain flow
  }
};

// ====================== Exports ======================
module.exports = {
  // Core Distribution Functions
  // distributeFundsByUserLevel,

  // Payment Link Processing
  processPendingPaymentLinks,
  handlePendingLinksForUser,
  processPendingPaymentLinksForSender,
  processOutgoingPaymentLink,
  upgradePaymentProcessing,

  // Transaction Execution
  executePaymentTransaction,

  // User Status Management
  updateSenderData,
  checkUserForActivation,

  // User Hierarchy Management
  updateUserUpline,
  updateSponsorUser,
  checkPassiveEligibilityAndGenerateLink,

  // Payment Link Utilities
  createPaymentLink,

  // Transaction Utilities
  isRatioComplete,
  generateUpgradeReceiveLinks,
  updateUserUplineAndSponsor,
  generateDirectRewardLinks,
};

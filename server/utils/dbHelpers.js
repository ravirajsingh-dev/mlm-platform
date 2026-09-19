const mongoose = require("mongoose");
const redlock = require("../config/redlock");

const Admin = require("../models/Admin");

const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const PaymentLink = require("../models/PaymentLink");
const Level = require("../models/Level");
const { defaultWalletTransferRatio } = require("./levelUtils");
const User = require("../models/User");
const { addJob } = require("../queueSystem/queueFactories/queueService");
const { sendSingleSMS } = require("../customClasses/smsServices");

const retryOperation = async (operation, retries = 5, delay = 300) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const msg = error.message || "";
      const isRetryable =
        msg.includes("Write conflict") ||
        msg.includes("TransientTransactionError");

      if (isRetryable && attempt < retries - 1) {
        console.warn(`Retrying (${attempt + 1}/${retries}): ${msg}`);
        await new Promise((resolve) =>
          setTimeout(resolve, delay * 2 ** attempt)
        );
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Operation failed after ${retries} retries`);
};

const fetchDocumentSafely = (model, filter, options = {}) =>
  retryOperation(async () => {
    const document = await model.findOne(filter, null, { ...options }).lean();
    if (!document) throw new Error("Document not found");
    return document;
  });

const updateDocumentSafely = (model, filter, update, options = {}) =>
  retryOperation(async () => {
    const updatedDoc = await model.findOneAndUpdate(
      filter,
      { $set: update },
      {
        returnDocument: "after",
        retryWrites: true,
        writeConcern: { w: "majority" },
        readConcern: { level: "majority" },
        ...options,
      }
    );
    if (!updatedDoc) throw new Error("Document not found or update failed");
    return updatedDoc;
  });

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const updateWalletBalance = async (
  userId,
  amount,
  currencyType,
  transactionType,
  description = "",
  initiatorId = null
) => {
  if (amount <= 0 || !["credit", "debit"].includes(transactionType)) {
    throw new Error("Invalid transaction parameters");
  }

  if (initiatorId && initiatorId.toString() === userId.toString()) {
    throw new Error("Self-transactions are not allowed");
  }

  const lockKey = `lock:wallet:${userId}`;
  const lockTTL = 15000; // 15 seconds
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let session;
    let lock;
    let extendInterval;

    try {
      // Acquire Redis Lock
      lock = await redlock.acquire([lockKey], lockTTL);
      console.log(`[LOCKED] User ${userId}`);

      // Auto extend lock
      extendInterval = setInterval(async () => {
        try {
          await lock.extend(lockTTL);
          console.log(`[LOCK EXTENDED] User ${userId}`);
        } catch (err) {
          console.error(`[EXTEND FAILED] User ${userId}:`, err.message);
        }
      }, lockTTL / 2);

      session = await mongoose.startSession();

      const result = await retryOperation(async () => {
        let opResult;

        await session.withTransaction(
          async () => {
            const query = {
              user: userId,
              ...(transactionType === "debit"
                ? { [currencyType]: { $gte: amount } }
                : {}),
            };

            const incFields = {
              [currencyType]: transactionType === "credit" ? amount : -amount,
            };

            const updatedWallet = await Wallet.findOneAndUpdate(
              query,
              { $inc: incFields },
              {
                session,
                returnDocument: "after",
                projection: {
                  _id: 1,
                  e_cash: 1,
                  upgrade: 1,
                  help: 1,
                  ddf: 1,
                  e_pool: 1,
                  e_pool_upgrade: 1,
                  totalBalance: 1,
                },
              }
            );

            if (!updatedWallet) {
              throw new Error(
                transactionType === "debit"
                  ? "Insufficient balance"
                  : "Wallet not found"
              );
            }

            const mudraBalance = updatedWallet.e_cash || 0;
            const upgradeBalance = updatedWallet.upgrade || 0;
            const helpBalance = updatedWallet.help || 0;
            const ddfBalance = updatedWallet.ddf || 0;
            const ePoolBalance = updatedWallet.e_pool || 0;
            const ePoolUpgradeBalance = updatedWallet.e_pool_upgrade || 0;

            updatedWallet.totalBalance =
              mudraBalance +
              upgradeBalance +
              helpBalance +
              ddfBalance +
              ePoolBalance +
              ePoolUpgradeBalance;

            await updatedWallet.save({ session });

            const [transaction] = await WalletTransaction.create(
              [
                {
                  user: userId,
                  wallet: updatedWallet._id,
                  walletType: currencyType,
                  type: transactionType,
                  amount,
                  balanceAfterTransaction: updatedWallet[currencyType],
                  description,
                  createdAt: new Date(),
                },
              ],
              { session }
            );

            opResult = {
              success: true,
              wallet: {
                id: updatedWallet._id,
                balance: updatedWallet[currencyType],
                totalBalance: updatedWallet.totalBalance,
                mudraBalance,
              },
              transaction,
            };
          },
          {
            writeConcern: { w: "majority", wtimeout: 5000 },
          }
        );

        return opResult;
      });

      return result;
    } catch (error) {
      console.error(
        `❌ Attempt ${attempt} failed for updateWalletBalance:`,
        error.message
      );

      if (attempt === maxRetries) {
        throw new Error(
          "Failed to update wallet balance after multiple attempts."
        );
      }

      await wait(200 * attempt); // retry backoff
    } finally {
      if (extendInterval) clearInterval(extendInterval);

      if (lock) {
        try {
          await lock.release();
          console.log(`[LOCK RELEASED] User ${userId}`);
        } catch (err) {
          console.error(`[LOCK RELEASE FAILED] User ${userId}:`, err.message);
        }
      }

      if (session) {
        try {
          await session.endSession();
        } catch (err) {
          console.error(`[SESSION END FAILED] User ${userId}:`, err.message);
        }
      }
    }
  }
};

const creditFundsToRootUser = async (
  receiver,
  amount,
  paymentType,
  sender
  // session
) => {
  const transactionDescription = `Received payment from ${sender.EP_ID} (${sender.name}) for ${paymentType} (₹${amount})`;

  // Choose wallet type based on paymentType
  const walletType = paymentType === "Help" ? "help" : "e_cash";

  const walletDetails = await updateWalletBalance(
    receiver._id,
    amount,
    walletType,
    "credit",
    transactionDescription,
    sender._id
    // session
  );

  console.log(
    `[Success] ₹${amount} credited to root user ${receiver?.EP_ID} in '${walletType}' wallet.`
  );

  // Send new password via SMS
  // const message = `Dear ${receiver.name}, Thank you for your generous contribution of ${amount}. Your payment has been successfully credited towards our Tree Plantation Initiative. Your Available Balance is ${walletDetails?.wallet?.totalBalance}. We deeply appreciate your support in making the planet greener. Thanks for being a part of EK PAHAL.`;

  // sendSingleSMS({
  //   phone: receiver.phone,
  //   message: message,
  //   templateId: creditTemplateID,
  // })
  //   .then((response) => {
  //     console.log("✅ Your SMS is sent:", response);
  //   })
  //   .catch((error) => {
  //     console.error("❌ Failed to send SMS:", error.message);
  //   });
};

const getAdmin = async () => {
  const adminUser = await Admin.findOne({}).select("_id").lean();

  if (!adminUser) {
    throw new Error("Admin user not found for Help payment");
  }

  return adminUser;
};

const transferWalletAmount = async (
  senderId,
  receiverId,
  amount,
  senderWalletType = "e_cash",
  receiverWalletType = "e_cash",
  senderDescription = "",
  receiverDescription = ""
) => {
  // Basic ID validation
  const sender = String(senderId);
  const receiver = String(receiverId);

  if (
    !mongoose.Types.ObjectId.isValid(sender) ||
    !mongoose.Types.ObjectId.isValid(receiver)
  ) {
    throw new Error("Invalid sender or receiver ID.");
  }

  if (sender === receiver) {
    throw new Error("Sender and receiver cannot be the same.");
  }

  if (typeof amount !== "number" || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  const validWalletTypes = ["e_cash", "upgrade", "e_pool_upgrade", "e_pool"];
  if (!validWalletTypes.includes(senderWalletType)) {
    throw new Error("Invalid sender wallet type.");
  }
  if (!validWalletTypes.includes(receiverWalletType)) {
    throw new Error("Invalid receiver wallet type.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Debit from sender's wallet
    const senderWallet = await Wallet.findOneAndUpdate(
      {
        user: sender,
        [senderWalletType]: { $gte: amount },
      },
      {
        $inc: {
          [senderWalletType]: -amount,
          ...(senderWalletType === "e_cash" ? { totalBalance: -amount } : {}),
        },
      },
      { session, returnDocument: "after" }
    );

    if (!senderWallet) {
      throw new Error("Sender wallet not found or insufficient balance.");
    }

    // 2. Credit to receiver's wallet
    const receiverWallet = await Wallet.findOneAndUpdate(
      { user: receiver },
      {
        $inc: {
          [receiverWalletType]: amount,
          ...(receiverWalletType === "e_cash" ? { totalBalance: amount } : {}),
        },
      },
      { session, returnDocument: "after" }
    );

    if (!receiverWallet) {
      throw new Error("Receiver wallet not found.");
    }

    // 3. Record transaction logs
    const now = new Date();

    await WalletTransaction.insertMany(
      [
        {
          user: sender,
          wallet: senderWallet._id,
          walletType: senderWalletType,
          type: "debit",
          amount,
          balanceAfterTransaction: senderWallet[senderWalletType],
          description:
            senderDescription ||
            `Debited ₹${amount} from ${senderWalletType} to ${receiverWalletType} of receiver`,
          createdAt: now,
        },
        {
          user: receiver,
          wallet: receiverWallet._id,
          walletType: receiverWalletType,
          type: "credit",
          amount,
          balanceAfterTransaction: receiverWallet[receiverWalletType],
          description:
            receiverDescription ||
            `Credited ₹${amount} to ${receiverWalletType} from ${senderWalletType} of sender`,
          createdAt: now,
        },
      ],
      { session }
    );

    // 4. Commit
    await session.commitTransaction();

    return {
      status: "success",
      message: "Transfer completed successfully.",
      balances: {
        sender: senderWallet[senderWalletType],
        receiver: receiverWallet[receiverWalletType],
      },
    };
  } catch (err) {
    await session.abortTransaction();
    console.error("Wallet Transfer Error:", err);
    throw new Error("Wallet transfer failed: " + err.message);
  } finally {
    session.endSession().catch(() => {});
  }
};

const transferEPoolToECashWithSurcharge = async ({
  userId,
  grossAmount,
  netAmount,
  surcharge,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 🔐 Atomic debit check
    const walletAfterDebit = await Wallet.findOneAndUpdate(
      {
        user: userId,
        e_pool: { $gte: grossAmount }, // FINAL GUARANTEE
      },
      {
        $inc: { e_pool: -grossAmount },
      },
      { session, returnDocument: "after" }
    );

    if (!walletAfterDebit) {
      throw new Error("Insufficient E-Pool balance");
    }

    // Credit net amount
    const walletAfterCredit = await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          e_cash: netAmount,
          totalBalance: netAmount,
        },
      },
      { session, returnDocument: "after" }
    );

    await WalletTransaction.insertMany(
      [
        {
          user: userId,
          wallet: walletAfterDebit._id,
          walletType: "e_pool",
          type: "debit",
          amount: grossAmount,
          balanceAfterTransaction: walletAfterDebit.e_pool,
          description:
            "E-Pool debited for E-Cash transfer (15% system surcharge)",
        },
        {
          user: userId,
          wallet: walletAfterCredit._id,
          walletType: "e_cash",
          type: "credit",
          amount: netAmount,
          balanceAfterTransaction: walletAfterCredit.e_cash,
          description: "E-Cash credited after surcharge deduction",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      grossAmount,
      surcharge,
      netAmount,
      e_pool_balance: walletAfterDebit.e_pool,
      e_cash_balance: walletAfterCredit.e_cash,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Confirm payment and perform wallet transfer using PaymentLink ID.
 * Assumes paymentLinkId is valid and secure.
 */
const confirmPaymentAndTransferFunds = async ({
  sender,
  receiver,
  amount,
  paymentLinkId,
  paymentType,
  senderWalletType = "e_cash",
  session,
}) => {
  // const session = await mongoose.startSession();

  try {
    // Start Transaction
    // session.startTransaction();

    // 1. Debit sender's wallet
    await updateWalletBalance(
      sender._id,
      amount,
      senderWalletType,
      "debit",
      `₹${amount.toFixed(2)} debited from ${senderWalletType} wallet ` +
        `(Level ${sender.user_level + 1}) for ${paymentType} payment ` +
        `to ${receiver.EP_ID} (${receiver.name})`,
      receiver._id
      // session
    );

    // 2. Update PaymentLink document
    // const updatedLink = await PaymentLink.findOneAndUpdate(
    //   { _id: paymentLinkId },
    //   {
    //     $set: {
    //       sender: sender._id,
    //       payment_for_level: sender.status === 3 ? 0 : sender.user_level + 1,
    //       sender_status: "paid",
    //       receiver_status: "confirmed",
    //       status: "completed",
    //     },
    //   },
    //   { session, new: true }
    // );

    paymentLinkId.sender_status = "paid";
    paymentLinkId.receiver_status = "confirmed";
    paymentLinkId.status = "completed";

    await paymentLinkId.save();
    console.log("updatedLink---------->>>>>", paymentLinkId);

    // 3. Credit receiver's wallet
    await creditFundsToUserWallet({
      receiver,
      sender,
      amount,
      paymentType,
      // session,
    });

    // Commit Transaction
    // await session.commitTransaction();
    // session.endSession();

    console.log("✅ Funds transferred and PaymentLink updated.");

    return { success: true };
  } catch (error) {
    // Abort Transaction
    // await session.abortTransaction();
    // session.endSession();

    console.log("Error from confirmPaymentAndTransferFunds", error);
    return { success: false };
  }
};

const isUpgradePaymentComplete = async (userId, level) => {
  const levelData = await Level.findOne({ level });

  if (!levelData || !Array.isArray(levelData.bits_for_upgrade)) {
    console.warn(`[Level Not Found or Invalid] Level: ${level}`);
    return false;
  }

  const requiredPayments = [...levelData.bits_for_upgrade];

  const completedLinks = await PaymentLink.find({
    sender: userId,
    payment_for_level: level,
    status: "completed",
  });

  console.log("completedLinks =====>", completedLinks);

  const completedCopy = [...completedLinks];

  const allMatched = requiredPayments.every((req) => {
    const matchIndex = completedCopy.findIndex(
      (link) =>
        link.payment_type === req.bits_type &&
        link.amount === req.bits &&
        link.payment_for_level === req.payment_for_level &&
        link.status === "completed"
    );

    if (matchIndex !== -1) {
      completedCopy.splice(matchIndex, 1);
      return true;
    }

    return false;
  });
  console.log("allMatched", allMatched);

  return allMatched;
};

const runAfterCommit = (session, callback) => {
  if (session && typeof session.once === "function") {
    session.once("committed", callback);
  } else {
    callback();
  }
};

const creditFundsToUserWallet = async ({
  receiver,
  sender,
  amount,
  paymentType = "direct",
  // session,
}) => {
  if (!receiver || !sender || amount <= 0) {
    throw new Error("Invalid receiver, sender, or amount.");
  }

  // Handle all root user credits (including "help")
  if (receiver.is_root) {
    await creditFundsToRootUser(receiver, amount, paymentType, sender);
    return;
  }

  // Prevent non-root users from receiving "help" payments
  if (paymentType === "help") {
    throw new Error("Help payments can only be credited to root users.");
  }

  // For non-root users: distribute based on their level ratio
  const level = receiver.user_level;
  const ratio = defaultWalletTransferRatio.find((r) => r.level === level);
  if (!ratio) throw new Error(`No wallet ratio found for level ${level}`);

  let e_cashAmount = Number(
    ((parseFloat(ratio.e_cash) / 100) * amount).toFixed(2)
  );
  let upgradeAmount = Number(
    ((parseFloat(ratio.upgrade) / 100) * amount).toFixed(2)
  );

  // ✅ Passive payment: full amount to e_cash, no upgrade entry
  if (paymentType === "Passive") {
    e_cashAmount = Number(amount.toFixed(2));
    upgradeAmount = 0;
  }

  // Detailed description for e_cash
  const gMudraDescription =
    `Help from ${sender.EP_ID} (${sender.name}) - ${paymentType}: ` +
    `₹${e_cashAmount} of ₹${amount.toFixed(2)} to E-Cash`;

  // Upgrade description
  const upgradeDescription =
    `Upgrade wallet credited with ₹${upgradeAmount} ` +
    `from ${sender.EP_ID} (${sender.name}) - ${paymentType}`;

  // ✅ Credit E-Cash
  if (e_cashAmount > 0) {
    const walletDetails = await updateWalletBalance(
      receiver._id,
      e_cashAmount,
      "e_cash",
      "credit",
      gMudraDescription,
      sender._id
      // session
    );

    const creditTemplateID = process.env.SMS_CREDIT_TEMPLATE_ID;
    const message = `Dear ${receiver.name}, Thank you for your generous contribution of ${amount}. Your payment has been successfully credited. Your Available Balance is ${walletDetails?.wallet?.mudraBalance}.`;

    // SMS disabled (unchanged)
  }

  // ❌ No upgrade entry created for Passive
  if (upgradeAmount > 0 && paymentType !== "Passive") {
    await updateWalletBalance(
      receiver._id,
      upgradeAmount,
      "upgrade",
      "credit",
      upgradeDescription,
      sender._id
      // session
    );

    setImmediate(async () => {
      try {
        const updatedReceiver = await User.findById(receiver._id)
          .select("-passCopy -password -uuid -txnPassCopy -txn_password")
          .lean();

        if (updatedReceiver) {
          await addJob(
            "upgradeProcessing",
            "sendUpgradePayment",
            updatedReceiver
          );
          console.log(`[Queued after commit] Job for ${updatedReceiver.EP_ID}`);
        }
      } catch (err) {
        console.error("Job queue after commit failed:", err.message);
      }
    });
  }

  // Upgrade commission logic (UNCHANGED)
  if (paymentType === "Upgrade") {
    const commissionAmount = Number((0.05 * amount).toFixed(2));

    try {
      const sponsor = await User.findOne({
        EP_ID: receiver.sponsorEP,
      }).select("EP_ID name sponsorEP user_level");

      let sponsorsSponsor = null;
      if (sponsor?.sponsorEP) {
        sponsorsSponsor = await User.findOne({
          EP_ID: sponsor.sponsorEP,
        }).select("EP_ID name user_level");
      }

      const debitDesc = (targetUser) =>
        `Upgrade commission: 5% (₹${commissionAmount}) deducted from e_cash for ${targetUser.EP_ID} (${targetUser.name})`;

      const creditDesc = (sourceUser) =>
        `Upgrade commission: Received 5% (₹${commissionAmount}) from ${sourceUser.EP_ID} (${sourceUser.name})`;

      if (sponsor) {
        await updateWalletBalance(
          receiver._id,
          commissionAmount,
          "e_cash",
          "debit",
          debitDesc(sponsor),
          sender._id
        );

        await updateWalletBalance(
          sponsor._id,
          commissionAmount,
          "e_cash",
          "credit",
          creditDesc(receiver),
          receiver._id
        );
      }

      if (sponsorsSponsor) {
        await updateWalletBalance(
          receiver._id,
          commissionAmount,
          "e_cash",
          "debit",
          debitDesc(sponsorsSponsor),
          sender._id
        );

        await updateWalletBalance(
          sponsorsSponsor._id,
          commissionAmount,
          "e_cash",
          "credit",
          creditDesc(receiver),
          receiver._id
        );
      }
    } catch (error) {
      console.error(`Commission processing failed: ${error.message}`);
      throw new Error("Failed to distribute upgrade commissions");
    }
  }

  console.log(
    `[SUCCESS] Funds distributed to ${receiver.EP_ID} for ${paymentType}`
  );
};

module.exports = {
  retryOperation,
  fetchDocumentSafely,
  updateDocumentSafely,
  updateWalletBalance,
  creditFundsToRootUser,
  getAdmin,
  transferWalletAmount,
  confirmPaymentAndTransferFunds,
  isUpgradePaymentComplete,
  runAfterCommit,
  transferEPoolToECashWithSurcharge,
};

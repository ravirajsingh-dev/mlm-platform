const mongoose = require("mongoose");
const { getSetting } = require("../models/Setting");
const User = require("../models/User");

const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const PaymentLink = require("../models/PaymentLink");

// Main Transfer Function
const transferToCommunityDDF = async () => {
  try {
    const communityId = await getSetting("_community_root_id");
    const transferAmount = 5;

    // 1. Find eligible users with optimized query
    const eligibleUsers = await User.aggregate([
      {
        $match: {
          user_level: { $gte: 2 },
        },
      },
      {
        $lookup: {
          from: "wallets",
          let: { uid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$uid"] },
                    { $gte: ["$e_cash", transferAmount] },
                  ],
                },
              },
            },
            { $limit: 1 },
            { $project: { _id: 1 } },
          ],
          as: "wallet",
        },
      },
      { $match: { "wallet.0": { $exists: true } } },
      { $unwind: "$wallet" },
      {
        $project: {
          _id: 1,
          wallet: "$wallet._id",
        },
      },
    ]);

    if (!eligibleUsers.length) {
      console.log("No eligible users for community DDF transfer");
      return;
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // 2. Process user debits
      const userTransactions = [];
      for (const user of eligibleUsers) {
        const wallet = await Wallet.findOneAndUpdate(
          {
            user: user._id,
            e_cash: { $gte: transferAmount },
          },
          {
            $inc: {
              e_cash: -transferAmount,
            },
          },
          {
            session,
            returnDocument: "after",
          },
        );

        if (!wallet) {
          throw new Error(`Wallet not found for user ${user._id}`);
        }

        userTransactions.push({
          user: user._id,
          wallet: user.wallet,
          walletType: "e_cash",
          type: "debit",
          amount: transferAmount,
          balanceAfterTransaction: wallet.e_cash,
          description: "Community DDF Contribution",
          createdAt: new Date(),
        });
      }

      // 3. Update community wallet
      const communityWallet = await Wallet.findOneAndUpdate(
        {
          user: communityId,
        },
        {
          $inc: {
            ddf: transferAmount * eligibleUsers.length,
          },
        },
        {
          session,
          returnDocument: "after",
        },
      );

      if (!communityWallet) {
        throw new Error("Community wallet not found");
      }

      // 4. Create transactions
      await WalletTransaction.insertMany(
        [
          ...userTransactions,
          {
            user: communityId,
            wallet: communityWallet._id,
            walletType: "ddf",
            type: "credit",
            amount: transferAmount * eligibleUsers.length,
            balanceAfterTransaction: communityWallet.ddf,
            description: `Batch contribution from ${eligibleUsers.length} users`,
            createdAt: new Date(),
          },
        ],
        { session },
      );
    });

    console.log(`✅ Successfully processed ${eligibleUsers.length} users`);
  } catch (error) {
    console.error("❌ Transfer failed:", error.message);
    throw error;
  }
};

const deactiveUnpaidAndPaymentLinks = async () => {
  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Get pending users (status: 3) whose activation window started 7+ days ago
    // For reactivated users, use reactivatedAt; otherwise use createdAt
    const pendingUsers = await User.find({
      status: 3,
      $expr: {
        $lt: [{ $ifNull: ["$reactivatedAt", "$createdAt"] }, sevenDaysAgo],
      },
    })
      .select("_id")
      .lean();

    console.log("Filtered pending users older than 48h:", pendingUsers.length);
    if (pendingUsers.length === 0) {
      console.log("No eligible pending users found");
      return;
    }

    const pendingUserIds = pendingUsers.map((u) => u._id);

    // 2. From those users, get ones whose payment links are also older than 48h
    const eligibleUserIds = await PaymentLink.find({
      sender: { $in: pendingUserIds },
      payment_type: { $in: ["Direct", "Help", "Passive"] },
      updatedAt: { $lt: sevenDaysAgo },
    }).distinct("sender");

    if (eligibleUserIds.length === 0) {
      console.log("No users with payment links older than 48 hours");
      return;
    }

    console.log("Eligible users for deactivation:", eligibleUserIds.length);

    // 3. Delete Direct & Help payment links
    const deletedLinks = await PaymentLink.deleteMany({
      sender: { $in: eligibleUserIds },
      payment_type: { $in: ["Direct", "Help"] },
    });
    console.log(`Deleted ${deletedLinks.deletedCount} Direct/Help links`);

    // 4. Update Passive payment links to pending
    const updatedPassiveLinks = await PaymentLink.updateMany(
      {
        sender: { $in: eligibleUserIds },
        payment_type: "Passive",
      },
      {
        $set: {
          sender: null,
          status: "pending",
          receiver_status: "pending",
          sender_status: "pending",
        },
      },
    );

    console.log(
      `Updated ${updatedPassiveLinks.modifiedCount} Passive payment links to pending`,
    );

    // 5. Update user status to 2 (Inactive)
    const updatedUsers = await User.updateMany(
      { _id: { $in: eligibleUserIds } },
      { $set: { status: 2 } },
    );
    console.log(`Deactivated ${updatedUsers.modifiedCount} users`);

    // // 6. Remove from binary tree structure
    // const leftUpdate = await User.updateMany(
    //   { left_leg: { $in: eligibleUserIds } },
    //   { $set: { left_leg: null } }
    // );
    // console.log(`Cleared ${leftUpdate.modifiedCount} left_leg references`);

    // const rightUpdate = await User.updateMany(
    //   { right_leg: { $in: eligibleUserIds } },
    //   { $set: { right_leg: null } }
    // );
    // console.log(`Cleared ${rightUpdate.modifiedCount} right_leg references`);

    console.log("✅ Cleanup completed successfully");
  } catch (error) {
    console.error("❌ Deactivation failed:", error.message);
    throw error;
  }
};

// ====================== Exports ======================
module.exports = {
  transferToCommunityDDF,
  deactiveUnpaidAndPaymentLinks,
};

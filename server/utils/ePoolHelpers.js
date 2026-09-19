const PaymentLink = require("../models/PaymentLink");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const { updateWalletBalance } = require("./dbHelpers");
const { ePoolEntryArray } = require("./levelUtils");
const { getSetting } = require("../models/Setting");

/* --------------------------------------------------
  HELPERS
-------------------------------------------------- */

const buildEPoolDescription = ({ type, fromEP, toEP, amount, level, reason }) =>
  `[E-Pool] ${type} | From:${fromEP} | To:${toEP} | Amt:${amount} | Level:${level} | Reason:${reason}`;

const getNextEPoolLevelConfig = (currentLevel) =>
  ePoolEntryArray.find((l) => l.level === currentLevel + 1);

const ePoolLevelEligibility = {
  // 2: { left: 5, right: 5 },
  4: { left: 32, right: 32 },
  // 6: { left: 256, right: 256 },
};

const isUserEligibleForLevel = (receiver, level) => {
  const rule = ePoolLevelEligibility[level];

  // ✅ If level has NO restriction → allow
  if (!rule) return true;

  return (
    receiver.total_left_users >= rule.left &&
    receiver.total_right_users >= rule.right
  );
};

/* --------------------------------------------------
  FIND PENDING LINK
-------------------------------------------------- */

const findPendingEPoolUpgradeLink = async (amount) => {
  const pendingLinks = await PaymentLink.find({
    payment_type: "E_Pool_Upgrade",
    status: "pending",
    amount,
  })
    .populate("receiver", "_id EP_ID name total_left_users total_right_users")
    .sort({ createdAt: 1 })
    .lean();

  for (const link of pendingLinks) {
    const level = link.payment_for_level;
    const receiver = link.receiver;

    // ✅ CHECK ELIGIBILITY OF RECEIVER
    if (isUserEligibleForLevel(receiver, level)) {
      return link;
    }
  }

  return null;
};

/* --------------------------------------------------
  PROCESS PAYMENT
-------------------------------------------------- */

const processPaymentToPendingLink = async (
  enteringUser,
  pendingLink,
  amount
) => {
  const receiver = pendingLink.receiver;
  const level = pendingLink.payment_for_level;

  const completedCount = await PaymentLink.countDocuments({
    receiver: receiver._id,
    payment_type: "E_Pool_Upgrade",
    payment_for_level: level,
    status: "completed",
  });

  // 1️⃣ Debit payer
  await updateWalletBalance(
    enteringUser._id,
    amount,
    "e_pool_upgrade",
    "debit",
    buildEPoolDescription({
      type: "DR",
      fromEP: `${enteringUser.EP_ID} (${enteringUser.name})`,
      toEP: `${receiver.EP_ID} (${receiver.name})`,
      amount,
      level,
      reason: "E-Pool upgrade payment",
    }),
    null
  );

  // 2️⃣ Credit receiver
  const isThird = completedCount + 1 === 3;
  const creditWallet = isThird ? "e_pool" : "e_pool_upgrade";

  await updateWalletBalance(
    receiver._id,
    amount,
    creditWallet,
    "credit",
    buildEPoolDescription({
      type: "CR",
      fromEP: `${enteringUser.EP_ID} (${enteringUser.name})`,
      toEP: `${receiver.EP_ID} (${receiver.name})`,
      amount,
      level,
      reason: isThird ? "credit e-pool earning" : "E-Pool upgrade",
    }),
    enteringUser._id
  );

  // 3️⃣ Complete link
  await PaymentLink.findByIdAndUpdate(pendingLink._id, {
    sender: enteringUser._id,
    sender_status: "paid",
    receiver_status: "confirmed",
    status: "completed",
  });

  /* -------------------------------
     AUTO NEXT LEVEL (AFTER 2nd)
  -------------------------------- */
  if (completedCount + 1 === 2) {
    const nextLevelConfig = getNextEPoolLevelConfig(level);
    if (!nextLevelConfig) return;

    const nextAmount = nextLevelConfig.upgrade[0].amount;
    const nextLevel = nextLevelConfig.level;

    const wallet = await Wallet.findOne({ user: receiver._id }).lean();
    if (!wallet || wallet.e_pool_upgrade < nextAmount) return;

    const nextPending = await findPendingEPoolUpgradeLink(nextAmount);

    if (nextPending) {
      await processPaymentToPendingLink(receiver, nextPending, nextAmount);
    } else {
      await sendPaymentToCommunity(receiver, nextAmount);
    }

    await generateEPoolEarningLinks(receiver._id, nextLevel);
  }
};

/* --------------------------------------------------
  COMMUNITY PAYMENT
-------------------------------------------------- */

const sendPaymentToCommunity = async (user, amount) => {
  const communityId = await getSetting("_community_root_id");
  const community = await User.findById(communityId).lean();

  const levelConfig = ePoolEntryArray.find(
    (l) => l.upgrade[0].amount === amount
  );

  const level = levelConfig.level;

  await updateWalletBalance(
    user._id,
    amount,
    "e_pool_upgrade",
    "debit",
    buildEPoolDescription({
      type: "DR",
      fromEP: `${user.EP_ID} (${user.name})`,
      toEP: `${community.EP_ID} (${community.name})`,
      amount,
      level,
      reason: "Community fallback payment",
    }),
    null
  );

  await updateWalletBalance(
    community._id,
    amount,
    "e_cash",
    "credit",
    buildEPoolDescription({
      type: "CR",
      fromEP: `${user.EP_ID} (${user.name})`,
      toEP: `${community.EP_ID} (${community.name})`,
      amount,
      level,
      reason: "Community E-Pool income",
    }),
    user._id
  );

  await PaymentLink.create({
    sender: user._id,
    receiver: community._id,
    amount,
    payment_type: "E_Pool_Upgrade",
    payment_for_level: level,
    sender_status: "paid",
    receiver_status: "confirmed",
    status: "completed",
  });
};

/* --------------------------------------------------
  GENERATE LINKS
-------------------------------------------------- */

const generateEPoolEarningLinks = async (userId, level) => {
  const config = ePoolEntryArray.find((l) => l.level === level);
  if (!config) return;

  const { amount, payment_for_level } =
    config.earningsAfterUpgrade.generateEarningLinks;

  for (let i = 0; i < 3; i++) {
    await PaymentLink.create({
      receiver: userId,
      amount,
      payment_type: "E_Pool_Upgrade",
      payment_for_level,
      status: "pending",
    });
  }
};

module.exports = {
  findPendingEPoolUpgradeLink,
  processPaymentToPendingLink,
  sendPaymentToCommunity,
  generateEPoolEarningLinks,
};

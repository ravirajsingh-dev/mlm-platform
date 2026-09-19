const User = require("../models/User");
const PaymentLink = require("../models/PaymentLink");

const userImmediateUpline = async (userId) => {
  try {
    // Fetch the user's upline based on their position in right_leg or left_leg
    const uplineUser = await User.findOne({
      $or: [{ right_leg: userId }, { left_leg: userId }],
    });

    if (!uplineUser) {
      console.log(`No upline user found for user ID: ${userId}`);
      return { uplineUser: null, position: null };
    }

    // Determine the position (left or right)
    const position = uplineUser.left_leg?.equals(userId) ? "left" : "right";

    console.log(`Upline user found: ${uplineUser.name}, Position: ${position}`);

    return { uplineUser, position };
  } catch (error) {
    console.error(`Error fetching upline user for user ID: ${userId}`, error);
    throw error; // Rethrow error for higher-level handling if needed
  }
};

const deactivateLast5DaysInactiveUsers = async () => {
  console.log(
    "******* Deactivating Users inactive for last 5 days - CRON JOB START ********"
  );

  const summary = {
    processedUsers: 0,
    skippedUsers: 0,
    totalUsers: 0,
    errors: [],
  };

  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    console.log("Processing users inactive since:", fiveDaysAgo);

    // Fetch inactive users (status: 3) created more than 5 days ago
    const inactiveUsers = await User.find({
      status: 3,
      createdAt: { $lt: fiveDaysAgo },
    }).lean();

    summary.totalUsers = inactiveUsers.length;

    if (inactiveUsers.length === 0) {
      console.log("No inactive users found.");
      return summary;
    }

    console.log(`Found ${inactiveUsers.length} inactive users.`);

    // Process users concurrently
    await Promise.all(
      inactiveUsers.map(async (user) => {
        try {
          console.log("Deactivating user:", user.name);

          const { uplineUser, position } = await userImmediateUpline(user._id);

          if (uplineUser) {
            // Remove the user from the appropriate position in the upline
            const updateKey =
              position === "left" ? { left_leg: null } : { right_leg: null };
            await User.findByIdAndUpdate(uplineUser._id, { $unset: updateKey });
            console.log(
              `Removed user ${user._id} from ${position}_leg of upline user ${uplineUser.name}.`
            );
          } else {
            console.log("No immediate upline user found.");
          }

          // Update user status to 2 (inactive)
          await User.findByIdAndUpdate(user._id, { status: 2 });

          // Fetch user's payment links
          const userPaymentLinks = await PaymentLink.find({
            sender: user._id,
            sender_status: "pending",
          }).lean();

          if (userPaymentLinks.length > 0) {
            console.log(
              `Processing ${userPaymentLinks.length} payment links for user: ${user.name}`
            );

            // Process payment links concurrently
            await Promise.all(
              userPaymentLinks.map(async (paymentLink) => {
                if (paymentLink.payment_type === "Direct") {
                  // Delete Direct payment link
                  await PaymentLink.findByIdAndDelete(paymentLink._id);
                } else if (paymentLink.payment_type === "Passive") {
                  // Update Passive payment link
                  await PaymentLink.findByIdAndUpdate(paymentLink._id, {
                    $set: { sender: null, sender_status: "pending" },
                  });
                }
              })
            );
          }

          summary.processedUsers += 1;
        } catch (userError) {
          console.error(`Error processing user ${user.name}:`, userError);
          summary.errors.push({ user: user.name, error: userError.message });
        }
      })
    );

    console.log("******* Deactivation CRON JOB COMPLETED ********");
  } catch (error) {
    console.error("Error in deactivating users:", error);
    summary.errors.push({ general: error.message });
  }

  return summary;
};

module.exports = deactivateLast5DaysInactiveUsers;

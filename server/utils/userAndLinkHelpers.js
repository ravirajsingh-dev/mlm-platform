const mongoose = require("mongoose");

const PaymentLink = require("../models/PaymentLink");
const User = require("../models/User");
const UserUpline = require("../models/UserUpline");
const Level = require("../models/Level");
const { getSetting } = require("../models/Setting");
const { passive_income } = require("./constants");
const FirstPayUser = require("../models/FirstPayUser");
const Admin = require("../models/Admin");

const sendPaymentLinkToCommunity2 = async (user, linkDetails) => {
  try {
    console.log("linkDetails", linkDetails);

    // Get community ID - ensure this uses the session if in a transaction
    const community_id = await getSetting("_community_root_id");

    const result = new PaymentLink({
      receiver: community_id,
      sender: user._id,
      amount: linkDetails.bits,
      payment_type: linkDetails.bits_type,
      payment_for_level: linkDetails.payment_for_level,
    });

    // Save with session options if provided
    await result.save();

    return result; // Return the result of the payment link creation
  } catch (error) {
    console.error("Error sending payment link to community:", error.message);
    throw error; // Re-throw to ensure outer transaction fails if nested
  } finally {
    // Only end session if we created it
  }
};

const sendPaymentLinkToCommunity = async (
  user,
  linkDetails,
  session = null
) => {
  // If no session provided, create a new one
  const shouldCommit = !session;
  let result = null;

  if (!session) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    console.log("linkDetails", linkDetails);

    // Get community ID - ensure this uses the session if in a transaction
    const community_id = await getSetting("_community_root_id", session);

    // Create the payment link with proper session handling
    result = await createPaymentLink(
      community_id,
      user._id,
      linkDetails.bits,
      linkDetails.bits_type,
      linkDetails.payment_for_level,
      session
    );

    // Only commit if we created the session locally
    if (shouldCommit) {
      await session.commitTransaction();
    }

    return result; // Return the result of the payment link creation
  } catch (error) {
    console.error("Error sending payment link to community:", error.message);
    if (shouldCommit) {
      await session.abortTransaction();
    }
    throw error; // Re-throw to ensure outer transaction fails if nested
  } finally {
    // Only end session if we created it
    if (shouldCommit) {
      session.endSession();
    }
  }
};

const sendHelpFundToCommunity = async (sender, linkDetails, session = null) => {
  try {
    // Get community ID - ensure this uses the session if in a transaction
    const community_id = await getSetting("_community_root_id");

    await createPaymentLink(
      community_id,
      sender._id,
      linkDetails.bits,
      linkDetails.bits_type,
      linkDetails.payment_for_level,
      session
    );
  } catch (error) {
    console.error("Error sending payment link to community:", error.message);
  }
};

// Optimized function to find the immediate available position for a new user
const findAvailablePosition = async (sponsorBy, position, session = null) => {
  const options = session ? { session } : {};

  try {
    // 1. First check sponsor's direct legs
    if (position === "left") {
      if (!sponsorBy.left_leg) {
        return { user: sponsorBy, position: "left" };
      }
    } else if (position === "right") {
      if (!sponsorBy.right_leg) {
        return { user: sponsorBy, position: "right" };
      }
    } else {
      throw new Error("Invalid position specified");
    }

    // 2. Search in the subtree with fresh data
    const rootUserId =
      position === "left" ? sponsorBy.left_leg : sponsorBy.right_leg;
    const rootUser = await User.findById(rootUserId, null, options);

    if (!rootUser) {
      throw new Error("Root user not found in subtree");
    }

    return await fillSubtree(rootUser, options);
  } catch (error) {
    console.error("Error finding available position:", error.message);
    throw error;
  }
};

// Optimized function to fill subtrees using breadth-first search (BFS)

const fillSubtree = async (rootUser, options) => {
  const queue = [rootUser];
  const visited = new Set(); // To prevent infinite loops

  while (queue.length > 0) {
    const currentUser = queue.shift();
    visited.add(currentUser._id.toString());

    // Check available positions with fresh data
    const freshUser = await User.findById(currentUser._id, null, options);

    if (!freshUser.left_leg) {
      return { user: freshUser, position: "left" };
    }
    if (!freshUser.right_leg) {
      return { user: freshUser, position: "right" };
    }

    // Get next level users with proper error handling
    let leftDownline, rightDownline;
    try {
      [leftDownline, rightDownline] = await Promise.all([
        User.findById(freshUser.left_leg, null, options),
        User.findById(freshUser.right_leg, null, options),
      ]);
    } catch (error) {
      console.error("Error fetching downlines:", error.message);
      throw error;
    }

    // Add to queue if not visited
    if (leftDownline && !visited.has(leftDownline._id.toString())) {
      queue.push(leftDownline);
    }
    if (rightDownline && !visited.has(rightDownline._id.toString())) {
      queue.push(rightDownline);
    }
  }

  throw new Error("No available position found in subtree");
};

const updateUserUpline = async (newUser) => {
  let user = newUser; // Assume this function fetches the initial value

  while (user) {
    if (!user) return;

    let parentUserOfParent = await User.findOne({
      $or: [{ left_leg: user._id }, { right_leg: user._id }],
    });

    if (!parentUserOfParent) return;

    if (String(parentUserOfParent.left_leg) === String(user._id)) {
      // child is in left downline
      await User.updateOne(
        {
          _id: parentUserOfParent._id,
        },
        {
          $inc: { total_left_users: 1 }, // Increment the count
        }
      );
    } else {
      // child is in right downline
      await User.updateOne(
        {
          _id: parentUserOfParent._id,
        },
        {
          $inc: { total_right_users: 1 }, // Increment the count
        }
      );
    }

    // Update the user after the action
    user = parentUserOfParent; // Fetch the updated value
  }
};
const isRatioComplete = (left, right, ratio_completed) => {
  return new Promise((resolve, reject) => {
    const minValue = Math.min(left, right);

    getSetting("ratio_list")
      .then((ratioList) => {
        if (minValue > ratio_completed) {
          const foundInArray = ratioList.find((element) => element == minValue);

          if (foundInArray) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching ratio_list:", error);
        reject(error); // Rejecting the promise if there's an error
      });
  });
};

const checkPassiveEligibilityAndGenerateLink = async (newUser) => {
  try {
    let currentUser = newUser;

    while (currentUser) {
      // Find the parent of the current user
      const parent = await User.findOne({
        $or: [{ left_leg: currentUser._id }, { right_leg: currentUser._id }],
      });

      if (!parent) return;

      const {
        i_added_to_left,
        i_added_to_right,
        total_left_users,
        total_right_users,
        ratio_completed = 0,
      } = parent;

      //TO check if the ratio is complete
      const isRatioDone = await isRatioComplete(
        total_left_users,
        total_right_users,
        parent.ratio_completed
      );

      if (i_added_to_left && i_added_to_right && isRatioDone) {
        const newRatioToBeGenerated = Math.min(
          total_left_users,
          total_right_users
        );

        // Generate passive income link
        await createPaymentLink(
          parent._id,
          null,
          passive_income,
          "Passive",
          parent.user_level
        );

        // Update parent with the new passive eligibility counts
        parent.ratio_completed = newRatioToBeGenerated;

        await parent.save();
      }

      currentUser = parent;
    }
  } catch (error) {
    console.error("Error checking passive income eligibility:", error.message);
  }
};

const createPaymentLink = async (
  receiverId,
  senderId,
  amount,
  payment_type,
  payment_for_level = null,
  session = null
) => {
  const options = session ? { session } : {};

  try {
    const paymentLinkDoc = new PaymentLink({
      receiver: receiverId,
      sender: senderId,
      amount,
      payment_type,
      payment_for_level,
    });

    // Save with session options if provided
    await paymentLinkDoc.save(options);

    return paymentLinkDoc;
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error; // Re-throw to ensure transaction rollback if in one
  }
};

const findPreferredUser = async (
  usersArray,
  targetUserLevel,
  session = null
) => {
  try {
    if (!usersArray?.length) {
      console.log("No users provided.");
      return [];
    }

    const userIdList = usersArray.map((u) => u._id);

    // Step 1: Fetch all UserUpline entries where uplines include any user from usersArray
    const uplinesData = await UserUpline.find(
      { uplines: { $in: userIdList } },
      "uplines user",
      { session }
    ).lean();

    // Step 2: Build a map from each user ID to their downline user IDs
    const uplineMap = {};
    for (const entry of uplinesData) {
      for (const uplineId of entry.uplines) {
        const idStr = uplineId.toString();
        if (!uplineMap[idStr]) uplineMap[idStr] = new Set();
        uplineMap[idStr].add(entry.user.toString());
      }
    }

    // Step 3: Build an array of unique downline user IDs we need to count
    const allDownlineIds = new Set();
    for (const userIds of Object.values(uplineMap)) {
      for (const id of userIds) {
        allDownlineIds.add(id);
      }
    }

    // Step 4: Get all target level users in one query
    const targetLevelUsers = await User.find(
      {
        _id: { $in: Array.from(allDownlineIds) },
        user_level: targetUserLevel,
      },
      "_id",
      { session }
    ).lean();

    const targetLevelIdSet = new Set(
      targetLevelUsers.map((u) => u._id.toString())
    );

    // Step 5: Count how many target-level downlines each user has
    let maxCount = 0;
    const preferredUsers = [];

    for (const user of usersArray) {
      const userIdStr = user._id.toString();
      const downlines = uplineMap[userIdStr] || new Set();
      let count = 0;

      for (const downlineId of downlines) {
        if (targetLevelIdSet.has(downlineId)) {
          count++;
        }
      }

      if (count > maxCount) {
        maxCount = count;
        preferredUsers.length = 0;
        preferredUsers.push(user);
      } else if (count === maxCount) {
        preferredUsers.push(user);
      }
    }

    console.log(
      `Preferred users with max count (${maxCount}):`,
      preferredUsers.map((u) => u.name)
    );

    return preferredUsers;
  } catch (error) {
    console.error("Error in findPreferredUser:", error.message);
    throw error;
  }
};

const assignPaymentLinkToPreferenceUser = async (
  user,
  linkDetails,
  isNewUser,
  session = null
) => {
  if (linkDetails.bits_type !== "Upgrade") return null;

  const options = session ? { session } : {};

  try {
    const rawLinks = await PaymentLink.find(
      {
        sender: null,
        payment_type: linkDetails.bits_type,
        amount: linkDetails.bits,
        status: "pending",
      },
      "_id receiver createdAt",
      options
    )
      .populate({ path: "receiver", options })
      .lean();

    const usersArray = [
      ...new Map(
        rawLinks.map((link) => [link.receiver._id.toString(), link.receiver])
      ).values(),
    ];

    const targetUserLevel = linkDetails.link_type - 1;

    const candidatesWithMaxCount = await findPreferredUser(
      usersArray,
      targetUserLevel,
      session
    );

    if (!candidatesWithMaxCount?.length) {
      console.log(
        `[PREF USER] No preferred candidates found for level ${targetUserLevel}.`
      );
      return null;
    }

    let finalPreferredUser = null;
    let oldestPaymentLink = null;

    const findOldestValidLink = (candidates) => {
      for (const candidate of candidates) {
        if (candidate._id.toString() === user._id.toString()) continue;
        for (const link of rawLinks) {
          if (
            link.receiver._id.toString() === candidate._id.toString() &&
            (!oldestPaymentLink || link.createdAt < oldestPaymentLink.createdAt)
          ) {
            oldestPaymentLink = link;
            finalPreferredUser = candidate;
          }
        }
      }
    };

    // First try direct candidates
    findOldestValidLink(candidatesWithMaxCount);

    // Fallback: remove current user from candidates and retry
    if (!finalPreferredUser || !oldestPaymentLink) {
      const filtered = candidatesWithMaxCount.filter(
        (c) => c._id.toString() !== user._id.toString()
      );
      findOldestValidLink(filtered);
    }

    if (!finalPreferredUser || !oldestPaymentLink) {
      console.log(
        `[PREF USER] No valid link found after scanning preferred users.`
      );
      return null;
    }

    const userLevel = isNewUser ? 0 : (user?.user_level ?? 0) + 1;

    const updatedLink = await PaymentLink.findOneAndUpdate(
      { _id: oldestPaymentLink._id },
      {
        $set: {
          sender: user._id,
          payment_for_level: userLevel,
        },
      },
      {
        returnDocument: "after",
        upsert: false,
        session,
      }
    );

    if (updatedLink) {
      console.log(
        `[PREF USER] Link assigned to ${
          finalPreferredUser.EP_ID || finalPreferredUser._id
        } by ${user.EP_ID}`
      );

      return updatedLink;
    }

    return null;
  } catch (error) {
    console.error(
      `❌ [PREF USER] Error in assignPaymentLinkToPreferenceUser for ${user.EP_ID}:`,
      error.message
    );
    throw error;
  }
};

const assignPaymentToAssignedUser = async (
  user,
  linkDetails,
  isNewUser,
  session = null
) => {
  const options = session ? { session } : {};

  try {
    const firstPayUser = await FirstPayUser.findOne({}, null, options);
    if (!firstPayUser || !firstPayUser.levels?.length) {
      console.log(
        `[ASSIGNED USER] No FirstPayUser or levels found for user ${user.EP_ID}`
      );
      return null;
    }

    for (const level of firstPayUser.levels) {
      const assignedUserId = level?.assignedUser?.toString();

      // Skip if assignedUser is missing or the current user itself
      if (!assignedUserId || assignedUserId === user._id.toString()) continue;

      const filter = {
        receiver: level.assignedUser,
        sender: null,
        payment_type: linkDetails.bits_type,
        amount: linkDetails.bits,
        status: "pending",
      };

      const update = {
        $set: {
          sender: user._id,
          payment_for_level: isNewUser ? 0 : user?.user_level + 1,
        },
      };

      const updatedLink = await PaymentLink.findOneAndUpdate(filter, update, {
        ...options,
        returnDocument: "after",
        sort: { createdAt: 1 },
        upsert: false,
      });

      if (updatedLink && updatedLink._id) {
        console.log(
          `[ASSIGNED USER] Payment link assigned to assigned user ${assignedUserId} for user ${user.EP_ID}`
        );
        return updatedLink;
      }
    }

    console.log(
      `[ASSIGNED USER] No matching payment link found for assigned users for user ${user.EP_ID}`
    );
    return null;
  } catch (error) {
    console.error(
      `❌ [ASSIGNED USER] Error in assignPaymentToAssignedUser for user ${user.EP_ID}:`,
      error.message
    );
    throw error;
  }
};

const assignPaymentToUplines = async (user, linkDetails, isNewUser) => {
  try {
    // 1. Fetch complete upline chain
    const uplineData = await UserUpline.findOne({ user: user._id }, "uplines")
      .lean();

    if (!uplineData?.uplines?.length) {
      console.log(`[UPLINES] No uplines for ${user.EP_ID}`);
      return null;
    }

    console.log("uplineData=======>>>", uplineData);

    // 2. Remove SELF
    const rawUplines = uplineData.uplines.filter(
      (id) => id.toString() !== user._id.toString()
    );

    if (!rawUplines.length) {
      console.log(`[UPLINES] No uplines after removing self`);
      return null;
    }

    // 3. Remove root users
    const nonRootUplines = await User.find(
      { _id: { $in: rawUplines }, is_root: false },
      { _id: 1 }
    ).lean();

    let validUplines = nonRootUplines.map((u) => u._id);

    if (!validUplines.length) {
      console.log(`[UPLINES] All uplines are root → skipping`);
      return null;
    }

    // 5. payment_for_level
    const paymentForLevel = isNewUser ? 0 : user.user_level + 1;

    // Filter uplines who HAVE pending link
    const pendingReceivers = await PaymentLink.find({
      receiver: { $in: validUplines },
      payment_type: "Upgrade",
      payment_for_level: paymentForLevel,
      amount: linkDetails.bits,
      status: "pending",
      sender: null,
    }).distinct("receiver");

    console.log("uplines having pending link:", pendingReceivers);

    // Remove uplines with NO pending link
    validUplines = validUplines.filter((id) =>
      pendingReceivers.some((pid) => pid.equals(id))
    );

    console.log("validUplines AFTER removing no-pending users:", validUplines);

    if (!validUplines.length) {
      console.log("[UPLINES] No uplines have pending link → stop");
      return null;
    }

    // 4. Aggregate & fetch eligible uplines (NO team filter)
    let eligibleUplines = await User.aggregate([
      { $match: { _id: { $in: validUplines } } },

      {
        $lookup: {
          from: "config_levels",
          localField: "user_level",
          foreignField: "level",
          as: "levelData",
        },
      },
      {
        $addFields: {
          requiredTeam: {
            $ifNull: [{ $arrayElemAt: ["$levelData.required_team", 0] }, 0],
          },
          teamSize: { $add: ["$total_left_users", "$total_right_users"] },
        },
      },
      // { $match: { $expr: { $gte: ["$teamSize", "$requiredTeam"] } } },
    ]);

    console.log("eligibleUplines======>>", eligibleUplines);

    if (!eligibleUplines.length) {
      console.log(`[UPLINES] No eligible uplines for ${user.EP_ID}`);
      return null;
    }

    // --------------------------------------
    // STEP 1 → Find who already got PaymentLink TODAY
    // --------------------------------------
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const uplinesGotToday = await PaymentLink.find({
      receiver: { $in: eligibleUplines.map((u) => u._id) },
      payment_type: "Upgrade",
      payment_for_level: paymentForLevel,
      amount: linkDetails.bits,
      status: "completed",
      updatedAt: { $gte: startOfToday },
    }).distinct("receiver");

    console.log("Already got today:", uplinesGotToday);

    // --------------------------------------
    // STEP 2 → Filter uplines who did NOT get a link today
    // --------------------------------------
    const freshUplines = eligibleUplines.filter(
      (u) => !uplinesGotToday.some((id) => id.equals(u._id))
    );

    console.log(
      "Fresh uplines:",
      freshUplines.map((u) => u.EP_ID)
    );

    let finalUpline = null;

    if (freshUplines.length > 0) {
      // Fetch oldest pending payment link for each fresh upline
      const freshWithOldestLink = await Promise.all(
        freshUplines.map(async (u) => {
          const oldestLink = await PaymentLink.findOne({
            receiver: u._id,
            payment_type: "Upgrade",
            payment_for_level: paymentForLevel,
            amount: linkDetails.bits,
            sender: null,
            status: "pending",
          }).sort({ createdAt: 1 });

          return {
            ...u,
            oldestLinkTime: oldestLink ? oldestLink.createdAt : new Date(),
          };
        })
      );

      // Sort based on oldest pending link
      freshWithOldestLink.sort(
        (a, b) => new Date(a.oldestLinkTime) - new Date(b.oldestLinkTime)
      );

      finalUpline = freshWithOldestLink[0];

      console.log(
        "Assigning to fresh upline (oldest pending link):",
        finalUpline.EP_ID
      );
    } else {
      // --------------------------------------
      // STEP 4 → Everyone already got today → pick highest teamSize
      // --------------------------------------
      eligibleUplines.sort((a, b) => b.teamSize - a.teamSize);
      finalUpline = eligibleUplines[0];

      console.log(
        "All got today. Assigning to highest teamSize:",
        finalUpline.EP_ID
      );
    }

    const finalUplineId = finalUpline._id;

    // Base filter for PaymentLink selection
    const baseFilter = {
      sender: null,
      receiver: finalUplineId,
      payment_type: "Upgrade",
      amount: linkDetails.bits,
      status: "pending",
    };

    // 6. Assign payment link
    const updatedLink = await PaymentLink.findOneAndUpdate(
      baseFilter,
      {
        $set: {
          sender: user._id,
          payment_for_level: paymentForLevel,
          updatedAt: new Date(),
        },
      },
      { sort: { createdAt: 1 }, returnDocument: "after" }
    );

    if (updatedLink) {
      console.log(`[UPLINES] Assigned link: ${updatedLink._id}`);
      return updatedLink;
    }

    console.log(`[UPLINES] No pending payment link found`);
    return null;
  } catch (error) {
    console.error(`[UPLINES] ERROR → ${error.message}`);
    throw error;
  }
};

const assignUplineForUpgradePayment = async (
  user,
  linkDetails,
  isNewUser
  // session
) => {
  try {
    const assignedToUplines = await assignPaymentToUplines(
      user,
      linkDetails,
      isNewUser
      // session
    );

    if (assignedToUplines) {
      console.log(
        `[Assigned assignPaymentToUplines] Upline Payment Link for ${user.EP_ID}`
      );
      return assignedToUplines;
    }

    const communityLink = await sendPaymentLinkToCommunity2(
      user,
      linkDetails
      // session
    );
    console.log(
      `[Assigned sendPaymentLinkToCommunity] Community Payment Link for ${user.EP_ID}`
    );
    return communityLink;
  } catch (error) {
    console.error(
      `[AssignError] assignUplineForUpgradePayment: ${error.message}`
    );
    throw error;
  }
};

const assignUplineForPassivePayment = async (
  user,
  linkDetails,
  isNewUser,
  session = null
) => {
  const shouldStartSession = !session;
  const localSession = shouldStartSession
    ? await mongoose.startSession()
    : session;

  const runLogic = async (sessionToUse) => {
    // Check how many completed payment links exist for the same level
    const completedLinksCount = await PaymentLink.countDocuments(
      {
        sender: user._id,
        payment_for_level: linkDetails.payment_for_level,
        payment_type: linkDetails.bits_type,
        amount: linkDetails.bits,
        status: "completed",
      },
      { session: sessionToUse }
    );

    console.log("completedLinksCount", completedLinksCount);
    if (completedLinksCount >= 2) {
      console.log("Already paid 2 passive links for this level. Skipping...");
      return;
    }

    // Fetch the uplines for the user
    const uplines = await UserUpline.findOne({ user })
      .select("uplines")
      .session(sessionToUse)
      .lean();

    if (!uplines || !uplines.uplines.length) {
      console.warn("No uplines found for the user");
      return;
    }

    const validUplines = uplines.uplines.filter(
      (upline) => upline.toString() !== user._id.toString()
    );

    if (validUplines.length === 0) {
      console.error("No valid uplines found (excluding the sender).");
      return;
    }

    const filter = {
      receiver: { $in: validUplines },
      sender: null,
      payment_type: linkDetails.bits_type,
      amount: linkDetails.bits,
      status: "pending",
    };

    const userLevelDetails = {
      user_level: isNewUser ? 0 : (user?.user_level || 0) + 1,
    };

    const update = {
      $set: {
        sender: user._id,
        payment_for_level: userLevelDetails.user_level,
      },
    };

    const updateOptions = {
      session: sessionToUse,
      returnDocument: "after",
      sort: { createdAt: 1 },
      upsert: false,
    };

    const updatedLink = await PaymentLink.findOneAndUpdate(
      filter,
      update,
      updateOptions
    );

    if (updatedLink) {
      console.log(
        "Passive link is updated. Assigned to user:",
        user.EP_ID,
        "Link ID:",
        updatedLink._id
      );
      return updatedLink;
    } else {
      console.log(
        "No pending payment link found. Creating new for community..."
      );
      const result = await sendPaymentLinkToCommunity(
        user,
        linkDetails,
        sessionToUse
      );
      return result;
    }
  };

  try {
    if (shouldStartSession) {
      await localSession.withTransaction(async () => {
        await runLogic(localSession);
      });
    } else {
      return await runLogic(localSession);
    }
  } catch (error) {
    console.error("Error assigning sender for passive payment:", error.message);
    throw error;
  } finally {
    if (shouldStartSession) {
      localSession.endSession();
    }
  }
};

// const assignUplineForPassivePayment = async (
//   user,
//   linkDetails,
//   isNewUser
//   // session = null
// ) => {
//   const session = await mongoose.startSession();
//   // try {
//   //   await session.withTransaction(async () => {
//   //     await updateSenderData(sender, paymentLink, session);
//   //   });
//   // } finally {
//   //   session.endSession();
//   // }

//   // const options = session ? { session } : {};

//   try {
//     // Check how many completed payment links exist for the same level
//     const completedLinksCount = await PaymentLink.countDocuments(
//       {
//         sender: user._id,
//         payment_for_level: linkDetails.payment_for_level,
//         payment_type: linkDetails.bits_type,
//         amount: linkDetails.bits,
//         status: "completed",
//       },
//       { session }
//     );

//     console.log("completedLinksCount", completedLinksCount);
//     if (completedLinksCount >= 2) {
//       console.log("Already paid 2 passive links for this level. Skipping...");
//       return;
//     }

//     // Fetch the uplines for the user with session
//     const uplines = await UserUpline.findOne({ user })
//       .select("uplines")
//       .session(session);

//     if (!uplines || !uplines.uplines.length) {
//       console.warn("No uplines found for the user");
//       return;
//     }

//     // Filter out uplines that are the same as the sender
//     const validUplines = uplines.uplines.filter(
//       (upline) => upline.toString() !== user._id.toString()
//     );

//     if (validUplines.length === 0) {
//       console.error("No valid uplines found (excluding the sender).");
//       return;
//     }

//     const filter = {
//       receiver: { $in: validUplines },
//       sender: null,
//       payment_type: linkDetails.bits_type,
//       amount: linkDetails.bits,
//       status: "pending",
//     };

//     let userLevelDetails = {};
//     if (isNewUser) {
//       userLevelDetails = { user_level: 0 };
//     } else {
//       userLevelDetails = { user_level: user?.user_level + 1 };
//     }

//     const update = {
//       $set: {
//         sender: user._id,
//         payment_for_level: userLevelDetails?.user_level,
//       },
//     };

//     const updateOptions = {
//       session,
//       new: true,
//       sort: { createdAt: 1 },
//       upsert: false,
//     };

//     const updatedLink = await PaymentLink.findOneAndUpdate(
//       filter,
//       update,
//       updateOptions
//     );

//     if (updatedLink) {
//       console.log(
//         "Passive link is updated. Assigned to user:",
//         user.EP_ID,
//         "Link ID:",
//         updatedLink._id
//       );

//       return updatedLink;
//     } else {
//       console.log(
//         "No pending payment link found. Creating new for community..."
//       );
//       const result = await sendPaymentLinkToCommunity(
//         user,
//         linkDetails,
//         session
//       );
//       return result;
//     }
//   } catch (error) {
//     console.error("Error assigning sender for passive payment:", error.message);
//     throw error; // Re-throw to ensure transaction is aborted if in one
//   }
// };

// Updated createPaymentLinkAsLevel with session

const createPaymentLinkAsLevel = async (receiver, sender, session = null) => {
  const options = session ? { session } : {};

  try {
    const senderLevelLinks = await Level.findOne({
      level: sender.user_level,
    }).session(session || null);

    if (!senderLevelLinks?.bits_for_upgrade) {
      console.warn(`No upgrade links for level ${sender.user_level}`);
      return;
    }

    // Process links in batches
    const BATCH_SIZE = 10;
    const batches = Math.ceil(
      senderLevelLinks.bits_for_upgrade.length / BATCH_SIZE
    );

    for (let i = 0; i < batches; i++) {
      const batch = senderLevelLinks.bits_for_upgrade.slice(
        i * BATCH_SIZE,
        (i + 1) * BATCH_SIZE
      );

      await Promise.all(
        batch.map(async (link) => {
          switch (link.bits_type) {
            case "Direct":
              await createPaymentLink(
                receiver._id,
                sender._id,
                link.bits,
                link.bits_type,
                link.payment_for_level,
                session
              );
              break;
            case "Passive":
              await assignUplineForPassivePayment(sender, link, true, session);
              break;
            case "Help":
              await sendHelpFundToCommunity(sender, link, session);
              break;
            case "Upgrade":
              await assignUplineForUpgradePayment(sender, link, true, session);
              break;
            default:
              console.warn(`Unknown bits type: ${link.bits_type}`);
          }
        })
      );
    }
  } catch (error) {
    console.error("Error creating payment links:", error.message);
    throw error;
  }
};

// Updated createUserUplinesArray with session
const createUserUplinesArray = async (user, session = null) => {
  const options = session ? { session } : {};

  try {
    const uplineUsersArray = [];
    let userInfo = user;

    while (userInfo) {
      const parent = await User.findOne(
        {
          EP_ID: userInfo.uplineEP,
        },
        null,
        options
      );

      if (!parent) break;
      uplineUsersArray.push(parent._id);
      userInfo = parent;
    }

    const userUplineDoc = new UserUpline({
      user: user._id,
      uplines: uplineUsersArray,
    });

    await userUplineDoc.save(options);
  } catch (error) {
    console.error("Error creating upline array:", error.message);
    throw error;
  }
};

module.exports = {
  findAvailablePosition,
  updateUserUpline,
  isRatioComplete,
  checkPassiveEligibilityAndGenerateLink,
  assignPaymentLinkToPreferenceUser,
  assignUplineForPassivePayment,
  createPaymentLink,
  createPaymentLinkAsLevel,
  createUserUplinesArray,
  assignUplineForUpgradePayment,
};

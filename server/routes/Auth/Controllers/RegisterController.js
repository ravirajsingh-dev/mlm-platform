const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

// Custom imports
const User = require("../../../models/User");
const Wallet = require("../../../models/Wallet");
const EPin = require("../../../models/EPin");
const CommonSettings = require("../../../models/CommonSettings");

const response = require("../../../config/response");
const { generateTokens } = require("../../../utils/authUtils");
const {
  setAuthTokenCookie,
  setAuthRefreshTokenCookie,
} = require("../../../utils/cookieUtils");
const {
  generateEPID,
  generateNumericPassword,
} = require("../../../utils/helper");

const {
  findAvailablePosition,
  createUserUplinesArray,
  createPaymentLinkAsLevel,
} = require("../../../utils/userAndLinkHelpers");

const { addJob } = require("../../../queueSystem/queueFactories/queueService");
const { sendSingleSMS } = require("../../../customClasses/smsServices");

// Main registration function
async function withRetryableTransaction(fn, maxRetries = 3, session) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (
        // error instanceof MongoServerError &&
        error.code === 112 && // WriteConflict code
        attempts < maxRetries - 1
      ) {
        attempts++;
        console.warn(`Write conflict detected, retrying (attempt ${attempts})`);
        await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
        continue;
      }
      throw error;
    }
  }
}

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (res) {
      return response.errorResponse(res, errors.array());
    } else {
      throw new Error(JSON.stringify(errors.array()));
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if registration is enabled
    const settings = await CommonSettings.getOrCreateSettings();
    if (!settings.registerEnabled) {
      await session.abortTransaction();
      session.endSession();

      const errorMsg = "Registration is currently disabled. Please contact administrator.";

      if (res) {
        return response.errorResponse(
          res,
          [
            {
              path: "register",
              msg: errorMsg,
            },
          ],
          errorMsg,
          503
        );
      } else {
        throw new Error(errorMsg);
      }
    }

    const {
      name,
      phone,
      EPin_ID,
      sponsorEP,
      position,
      city,
      state,
      country,
      password,
      terms_accepted,
    } = req.body;

    const capitalSponsorID = sponsorEP.toUpperCase();
    const sponsorBy = await User.findOne({ EP_ID: capitalSponsorID }).session(
      session
    );

    if (!sponsorBy || sponsorBy.status !== 1) {
      await session.abortTransaction();
      session.endSession();

      const errorMsg = "No user found with this EP ID or inactive.";

      if (res) {
        return response.errorResponse(
          res,
          [
            {
              path: "sponsorBy",
              msg: errorMsg,
            },
          ],
          errorMsg,
          400
        );
      } else {
        throw new Error(errorMsg);
      }
    }

    // Root user can only sponsor 1 ID - this is not for public use
    if (sponsorBy.is_root && sponsorBy.total_direct_users >= 1) {
      await session.abortTransaction();
      session.endSession();

      const errorMsg =
        "This root admin user can only sponsor one ID. Please use a different sponsor.";

      if (res) {
        return response.errorResponse(
          res,
          [
            {
              path: "sponsorEP",
              msg: errorMsg,
            },
          ],
          errorMsg,
          400
        );
      } else {
        throw new Error(errorMsg);
      }
    }

    const verifyEPin = await EPin.findOne({
      EPin_ID,
      is_expired: false,
    }).lean();

    if (!verifyEPin) {
      await session.abortTransaction();
      session.endSession();

      const errorMsg = "Invalid EP-Key";
      if (res) {
        return response.errorResponse(
          res,
          [
            {
              path: "EPin_ID",
              msg: errorMsg,
            },
          ],
          errorMsg,
          400
        );
      } else {
        throw new Error(errorMsg);
      }
    }

    // if (verifyEPin.EP_ID !== sponsorBy.EP_ID) {
    //   return response.errorResponse(
    //     res,
    //     [
    //       {
    //         path: "EPin_ID",
    //         msg: "The entered EPin does not match the assigned sponsor. Please verify and try again.",
    //       },
    //     ],
    //     "The entered EPin does not match the assigned sponsor. Please verify and try again.",
    //     400
    //   );
    // }

    // Generate new user data
    const EP_ID = generateEPID();
    // const password = generateNumericPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      ccode: "91",
      phone,
      sponsorEP,
      position,
      city,
      state,
      country,
      password: hashedPassword,
      passCopy: password,
      terms_accepted,
      uuid: randomUUID(),
      last_login: Date.now(),
      EP_ID,
      status: 3, // Initial status
    };

    // Create user within transaction
    const user = new User(userData);
    await user.save({ session });

    // Find position and update tree (with retry logic)
    await withRetryableTransaction(async () => {
      const { user: assignedUser, position: assignedPosition } =
        await findAvailablePosition(sponsorBy, position, session);

      if (assignedPosition === "left") {
        assignedUser.left_leg = user._id;
      } else {
        assignedUser.right_leg = user._id;
      }

      user.uplineEP = assignedUser.EP_ID;
      await assignedUser.save({ session });
      await user.save({ session });
    }, 3);

    // Update the EPin as used and mark it as expired
    await EPin.updateOne(
      { EPin_ID },
      {
        $set: {
          is_expired: true,
          used_by: user.EP_ID,
        },
      }
    );

    // Create upline array and payment links
    await createUserUplinesArray(user, session);
    await createPaymentLinkAsLevel(sponsorBy, user, session);

    // Create wallet
    const wallet = new Wallet({
      user: user._id,
      totalBalance: 0,
      e_cash: 0,
      upgrade: 0,
    });
    await wallet.save({ session });

    // Generate tokens
    const { accessToken, refreshToken, sessionID } = await generateTokens(user);
    const registerTemplateTD = process.env.SMS_REGISTER_TEMPLATE_ID;
    const message = `Congratulations ${name}! You have successfully registered for the Tree Plantation Initiative by EK PAHAL. Your User ID: ${EP_ID} Your Password: ${password} Thank you for joining us in helping to create a healthier planet and restore the environment!`;

    // sendSingleSMS({
    //   phone: phone,
    //   message: message,
    //   templateId: registerTemplateTD,
    // })
    //   .then((response) => {
    //     console.log("✅ Your SMS is sent:", response);
    //   })
    //   .catch((error) => {
    //     console.error("❌ Failed to send SMS:", error.message);
    //   });

    // Commit transaction if everything succeeds
    await session.commitTransaction();
    session.endSession();

    return {
      user,
      accessToken,
      refreshToken,
      sessionID,
    };
  } catch (err) {
    session.endSession();
    console.error("Registration error:", err.message);

    if (res) {
      return response.errorResponse(
        res,
        { msg: err.message },
        "Server Error.",
        500
      );
    } else {
      throw new Error(err.message);
    }
  }
};
const registerUser = async (req, res) => {
  try {
    const registrationResult = await addJob(
      "userRegistration",
      "registerUser",
      {
        reqData: req.body,
      }
    );

    return response.successResponse(
      res,
      registrationResult,
      "User registered successfully.",
      200
    );
  } catch (error) {
    console.error("Error adding registration job:", error);
    return response.errorResponse(
      res,
      { msg: error.message },
      "Failed to queue registration.",
      500
    );
  }
};

module.exports = {
  register,
  registerUser,
};

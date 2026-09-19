const express = require("express");
const session = require("express-session");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const { register, registerUser } = require("./Controllers/RegisterController");
const standard_password = require("../../utils/constants");
const response = require("../../config/response");

const { JWT_ACCESS_SECRET } = require("../../config/config");
const EPin = require("../../models/EPin");

// Configure session middleware
router.use(
  session({
    secret: JWT_ACCESS_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

router.post(
  "/register",
  [
    check("name", "Name is required and should be at most 50 characters long")
      .isString()
      .isLength({ max: 50 }),

    check("phone", "Enter a valid phone number")
      .isMobilePhone("any", { strictMode: false })
      .withMessage("Invalid phone number format")
      .not()
      .isEmpty()
      .custom(async (value) => {
        const existingUsers = await User.countDocuments({
          phone: value,
          status: { $ne: 2 },
        });

        if (existingUsers >= 3) {
          throw new Error(
            "This phone number is already associated with 3 accounts"
          );
        }
        return true;
      }),

    check(
      "sponsorEP",
      "Sponsor ID is required and should be at most 9 characters long"
    )
      .isString()
      .isLength({ max: 9 })
      .custom(async (value, { req }) => {
        if (value) {
          const capitalSponsorID = value.toUpperCase();

          const sponsorBy = await User.findOne({
            EP_ID: capitalSponsorID,
            status: 1,
          });
          if (!sponsorBy) {
            throw new Error("No user found with this EP ID or inactive.");
          }

          // Root user can only sponsor 1 ID
          if (sponsorBy.is_root && sponsorBy.total_direct_users >= 1) {
            throw new Error(
              "This root admin user can only sponsor one ID. Please use a different sponsor."
            );
          }
        }
      }),

    check("EPin_ID")
      .exists()
      .withMessage("EPin_ID is required")
      .isString()
      .isLength({ min: 15, max: 15 })
      .withMessage("EPin_ID must be exactly 15 characters long")
      .custom(async (value, { req }) => {
        const epin = await EPin.findOne({
          EPin_ID: value,
          is_expired: false,
        });

        if (!epin) {
          throw new Error("Invalid or expired EPin_ID");
        }

        return true;
      }),

    check(
      "city",
      "District is required and should be at most 50 characters long"
    )
      .isString()
      .isLength({ max: 50 }),

    check("state", "State is required and should be at most 50 characters long")
      .isString()
      .isLength({ max: 50 }),

    check(
      "country",
      "Country code is required and should be exactly 2 characters long"
    )
      .isString()
      .isLength({ min: 2, max: 2 }),

    // check("captchaToken", "Captcha token is required").not().isEmpty(),

    // check("password", standard_password.validation_msg).matches(
    //   standard_password.validation_pattern
    // ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // req.session.captchaToken = req.body.captchaToken;

      await registerUser(req, res);
    } catch (error) {
      console.error("Error handling user registration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;

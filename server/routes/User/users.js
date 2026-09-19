const express = require("express");
const router = express.Router();
const { UserAuth } = require("../../middleware/auth");
const { check } = require("express-validator");
const {
  updateUserById,
  updateAvatarByUserId,
} = require("./Controllers/UserController");
const User = require("../../models/User");

// @route PUT api/users/:user_id
// @desc Edit user Nickname by user_id
// @access Private
router.put(
  "/:user_id",
  [
    UserAuth,
    [
      check("name", "Please provide the name")
        .not()
        .isEmpty()
        .withMessage("Name cannot be empty")
        .isLength({ min: 3, max: 20 })
        .withMessage("Name must be between 3 and 20 characters long"),

      check("email", "Enter a valid email")
        .isEmail()
        .withMessage("Invalid email address")
        .custom(async (value, { req }) => {
          const user_id = req.params.user_id;
          if (value) {
            const is_user_exists = await User.findOne({
              email: value,
              _id: { $ne: user_id },
            });
            if (is_user_exists) {
              throw new Error("Provided email is already registered.");
            }
          }
        })
        .not()
        .isEmpty(),

      check("phone", "Enter a valid phone number")
        .isMobilePhone("any", { strictMode: false })
        .withMessage("Invalid phone number format")
        // .custom(async (value, { req }) => {
        //   const user_id = req.params.user_id;
        //   if (value) {
        //     const isUserExists = await User.findOne({
        //       phone: value,
        //       _id: { $ne: user_id },
        //     });
        //     if (isUserExists) {
        //       throw new Error("Provided phone number is already registered.");
        //     }
        //   }
        // })
        .not()
        .isEmpty(),

      check(
        "state",
        "State is required and should be at most 50 characters long"
      )
        .isString()
        .isLength({ max: 50 }),
    ],
  ],
  updateUserById
);

// @route PUT api/users/:user_id/avatar
// @desc Update user avatar by user_id
// @access Private
router.put(
  "/:user_id/avatar",
  [
    UserAuth,
    [
      check("avatar", "Please provide the avatar")
        .not()
        .isEmpty()
        .withMessage("Avatar cannot be empty")
        .isLength({ min: 3, max: 10 })
        .withMessage("Avatar must be between 3 and 10 characters long"),
    ],
  ],
  updateAvatarByUserId
);

module.exports = router;

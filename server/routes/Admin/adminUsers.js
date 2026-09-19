const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../middleware/auth");
const { check } = require("express-validator");

const User = require("../../models/User");

const {
  getUsersList,
  getUserById,
  updateUserById,
  deleteUserById,
  exportUsersList,
  reactivateUserById,
} = require("./Controllers/AdminUserController");

// @route GET api/admin/users/list
// @desc Get users list
// @access Private
router.get("/list", [AdminAuth], getUsersList);

// @route GET api/admin/users/export
// @desc Export users list to Excel
// @access Private
router.get("/export", [AdminAuth], exportUsersList);

// @route POST api/admin/users/:user_id/reactivate
// @desc Reactivate inactive user and recreate payment links
// @access Private
router.post("/:user_id/reactivate", AdminAuth, reactivateUserById);

// @route GET api/admin/users/:user_id
// @desc Get user by user_id
// @access Private
router.get("/:user_id", AdminAuth, getUserById);

// @route POST api/admin/users/:user_id
// @desc Edit user profile by user_id
// @access Private
router.put(
  "/:user_id",
  [
    AdminAuth,
    // [
    //   check("firstname", "Please provide the firstname")
    //     .not()
    //     .trim()
    //     .isEmpty()
    //     .isLength({ max: 100 })
    //     .withMessage("The first name must be maximum 100 chars long"),

    //   check("lastname", "Please provide the lastname")
    //     .not()
    //     .trim()
    //     .isEmpty()
    //     .isLength({ max: 100 })
    //     .withMessage("The last name must be maximum 100 chars long"),

    //   check("email", "Enter a valid email")
    //     .isEmail()
    //     .custom(async (value, { req }) => {
    //       let is_user_exist = await User.findOne({
    //         _id: { $ne: req.params.user_id },
    //         email: value,
    //       });

    //       if (!_.isEmpty(is_user_exist)) {
    //         throw new Error("Provided email is already registered");
    //       }
    //     }),

    //   check("phone", "Enter a valid phone number")
    //     .not()
    //     .isEmpty()
    //     .isMobilePhone("any", { strictMode: false })
    //     .withMessage("Invalid phone number format")
    //     .custom(async (value, { req }) => {
    //       const { phone } = req.body;
    //       let is_user_exist = await User.findOne({
    //         _id: { $ne: req.params.user_id },
    //         phone: phone,
    //       });
    //       if (is_user_exist) {
    //         throw new Error("Provided phone number is already registered.");
    //       }
    //     }),
    // ],
  ],
  updateUserById
);

// @route DELETE api/admin/users/:user_id
// @desc Delete user by user_id
// @access Private
router.delete("/:user_id", AdminAuth, deleteUserById);

module.exports = router;

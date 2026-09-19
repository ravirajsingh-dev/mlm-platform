const { body } = require("express-validator");
const CommonSettings = require("../../models/CommonSettings");

/**
 * Validation rules for withdrawal request
 */
const withdrawalRequestValidation = [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => {
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      return true;
    }),
  body("upiId")
    .trim()
    .notEmpty()
    .withMessage("UPI ID is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("UPI ID must be between 3 and 100 characters"),
  body("upiHolderName")
    .trim()
    .notEmpty()
    .withMessage("UPI Holder Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("UPI Holder Name must be between 2 and 100 characters"),
];

/**
 * Validation rules for admin approval
 */
const approveWithdrawalValidation = [
  body("utrNumber")
    .trim()
    .notEmpty()
    .withMessage("UTR Number is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("UTR Number must be between 3 and 50 characters"),
  body("adminRemark")
    .trim()
    .notEmpty()
    .withMessage("Admin remark is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Admin remark must be between 5 and 500 characters"),
];

/**
 * Validation rules for admin rejection
 */
const rejectWithdrawalValidation = [
  body("adminRemark")
    .trim()
    .notEmpty()
    .withMessage("Admin remark is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Admin remark must be between 5 and 500 characters"),
];

module.exports = {
  withdrawalRequestValidation,
  approveWithdrawalValidation,
  rejectWithdrawalValidation,
};


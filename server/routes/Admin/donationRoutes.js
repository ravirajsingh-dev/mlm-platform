const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { AdminAuth } = require("../../middleware/auth");

const {
  getAllDonationButtons,
  createDonationButton,
  updateDonationButton,
  deleteDonationButton,
  getAllDonationRequests,
  getDonationRequest,
  approveDonationRequest,
  rejectDonationRequest,
} = require("./Controllers/DonationController");

// Donation Buttons Routes

// @route GET /api/admin/donation/buttons
// @desc Get all donation buttons
// @access Private (Admin)
router.get("/buttons", AdminAuth, getAllDonationButtons);

// @route POST /api/admin/donation/buttons
// @desc Create donation button
// @access Private (Admin)
router.post(
  "/buttons",
  [
    AdminAuth,
    [
      check("amount")
        .optional()
        .isNumeric()
        .withMessage("Amount must be a number")
        .custom((value, { req }) => {
          if (req.body.type === "FIXED") {
            if (!value || value <= 0) {
              throw new Error("Amount is required and must be greater than 0 for FIXED type");
            }
          }
          return true;
        }),
      check("peopleFed")
        .optional()
        .isInt({ min: 0 })
        .withMessage("People fed must be a non-negative integer")
        .custom((value, { req }) => {
          if (req.body.type === "FIXED" && value === undefined) {
            throw new Error("People fed count is required for FIXED type");
          }
          return true;
        }),
      check("type", "Type is required")
        .isIn(["FIXED", "ANY"])
        .withMessage("Type must be either FIXED or ANY"),
    ],
  ],
  createDonationButton
);

// @route PUT /api/admin/donation/buttons/:id
// @desc Update donation button
// @access Private (Admin)
router.put(
  "/buttons/:id",
  [
    AdminAuth,
    [
      check("amount")
        .optional()
        .isNumeric()
        .withMessage("Amount must be a number")
        .custom((value) => {
          if (value <= 0) {
            throw new Error("Amount must be greater than 0");
          }
          return true;
        }),
      check("peopleFed")
        .optional()
        .isInt({ min: 0 })
        .withMessage("People fed must be a non-negative integer"),
      check("type")
        .optional()
        .isIn(["FIXED", "ANY"])
        .withMessage("Type must be either FIXED or ANY"),
    ],
  ],
  updateDonationButton
);

// @route DELETE /api/admin/donation/buttons/:id
// @desc Delete donation button
// @access Private (Admin)
router.delete("/buttons/:id", AdminAuth, deleteDonationButton);

// Donation Requests Routes

// @route GET /api/admin/donation/requests
// @desc Get all donation requests with filters
// @access Private (Admin)
router.get("/requests", AdminAuth, getAllDonationRequests);

// @route GET /api/admin/donation/requests/:id
// @desc Get single donation request
// @access Private (Admin)
router.get("/requests/:id", AdminAuth, getDonationRequest);

// @route PUT /api/admin/donation/requests/:id/approve
// @desc Approve donation request
// @access Private (Admin)
router.put("/requests/:id/approve", AdminAuth, approveDonationRequest);

// @route PUT /api/admin/donation/requests/:id/reject
// @desc Reject donation request
// @access Private (Admin)
router.put("/requests/:id/reject", AdminAuth, rejectDonationRequest);

module.exports = router;


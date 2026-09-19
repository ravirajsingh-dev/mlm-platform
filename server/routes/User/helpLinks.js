const express = require("express");
const router = express.Router();
const {
  getSendPaymentLinksByUserID,
  getReceivePaymentLinksByUserID,
} = require("./Controllers/HelpLinkController");
const { UserAuth } = require("../../middleware/auth");

// @route GET /api/users/help-links/:user_id/to-be-send/list
// @desc Fetch send links by user_id
// @access Private
router.get("/send", [UserAuth], getSendPaymentLinksByUserID);

// @route GET /api/users/help-links/:user_id/to-be-send/list
// @desc Fetch send links by user_id
// @access Private
router.get("/receive", [UserAuth], getReceivePaymentLinksByUserID);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getAllSenderUsersPaidList,
  editHelpLinksByPaymentID,
  getAllReceivePaymentLinks,
  getDownlinePendingLinks,
} = require("./Controllers/AdminHelpLinksController");
const { AdminAuth } = require("../../middleware/auth");

// @route PUT api/admin/help-links/:help_link_id/:user_id
// @desc Edit help links by user_id & help_link_id
// @access Private
router.get("/approve-pending", [AdminAuth], getAllReceivePaymentLinks);

// @route PUT api/admin/help-links/:help_link_id/:user_id
// @desc Edit help links by user_id & help_link_id
// @access Private
router.put("/:help_link_id/update-status", AdminAuth, editHelpLinksByPaymentID);

// @route GET /api/admin/help-link/all-pending-links
// @desc Fetch send links by user_id
// @access Private
router.get("/all-pending-links", [AdminAuth], getDownlinePendingLinks);

module.exports = router;

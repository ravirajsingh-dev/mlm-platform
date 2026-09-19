/**
 * Email Service Module
 * 
 * Purpose: Main entry point for email functionality
 * 
 * Architecture:
 * - brevoClient.js: Low-level Brevo API HTTP client
 * - emailService.js: High-level email sending service
 * - templates.js: Email templates and subjects
 * 
 * Usage:
 *   const emailService = require('./services/email');
 *   
 *   // Send generic email
 *   await emailService.sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Welcome',
 *     html: '<h1>Welcome!</h1>'
 *   });
 *   
 *   // Send donation thank you email
 *   await emailService.sendDonationThankYouEmail({
 *     donorName: 'John Doe',
 *     email: 'john@example.com',
 *     amount: 1000,
 *     paymentMode: 'UPI'
 *   });
 */

const emailService = require("./emailService");
const templates = require("./templates");
const brevoClient = require("./brevoClient");

/**
 * Send donation thank you email
 * @param {Object} donationRequest - Donation request data
 * @param {string} donationRequest.donorName - Donor name
 * @param {string} donationRequest.email - Donor email
 * @param {number} donationRequest.amount - Donation amount
 * @param {string} donationRequest.paymentMode - Payment mode (UPI/BANK)
 * @returns {Promise<Object>} Email sending result
 */
const sendDonationThankYouEmail = async (donationRequest) => {
  const { donorName, email, amount, paymentMode } = donationRequest;

  const html = templates.getDonationThankYouTemplate({
    donorName,
    amount,
    paymentMode,
  });

  return await emailService.sendEmail({
    to: email,
    subject: templates.SUBJECTS.DONATION_THANK_YOU,
    html: html,
  });
};

module.exports = {
  // Core service
  sendEmail: emailService.sendEmail,

  // Pre-built email functions
  sendDonationThankYouEmail,

  // Low-level client (for advanced use cases)
  verifyConnection: brevoClient.verifyConnection,
};

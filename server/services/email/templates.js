const config = require("../../config/config");

/**
 * Email Templates
 *
 * Purpose: Centralized email templates and subjects
 *
 * Benefits:
 * - Single source of truth for email content
 * - Easy to update templates
 * - Consistent branding
 */

/**
 * Get donation thank you email HTML template
 * @param {Object} data - Template data
 * @param {string} data.donorName - Donor name
 * @param {number} data.amount - Donation amount
 * @param {string} data.paymentMode - Payment mode (UPI/BANK)
 * @returns {string} HTML email content
 */
const getDonationThankYouTemplate = ({ donorName, amount, paymentMode }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Your Donation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #27ae60;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .donation-details {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .donation-details h3 {
          color: #2c3e50;
          margin-top: 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #27ae60;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #777;
          font-size: 14px;
        }
        .thank-you-message {
          font-size: 18px;
          color: #27ae60;
          margin: 20px 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EK PAHAL</h1>
          <p>Fighting Hunger, Spreading Hope</p>
        </div>
        
        <div class="content">
          <p>Dear ${donorName},</p>
          
          <p>We are deeply grateful for your generous donation to EK PAHAL. Your contribution helps us in our mission to eliminate hunger and connect food donors with those in need.</p>
          
          <div class="thank-you-message">
            🙏 Thank You for Making a Difference! 🙏
          </div>
          
          <div class="donation-details">
            <h3>Your Donation Details</h3>
            <div class="detail-row">
              <span class="detail-label">Donor Name:</span>
              <span class="detail-value">${donorName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value amount">₹${amount.toLocaleString(
                "en-IN"
              )}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Mode:</span>
              <span class="detail-value">${paymentMode}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #27ae60; font-weight: bold;">Approved</span>
            </div>
          </div>
          
          <p>Your donation has been approved and will be used to provide meals to those in need. Every contribution, big or small, makes a significant impact in someone's life.</p>
          
          <p>We truly appreciate your support and compassion. Together, we can create a world where hunger no longer exists.</p>
          
          <p>With heartfelt gratitude,<br><strong>The EK PAHAL Team</strong></p>
        </div>
        
        <div class="footer">
          <p>For any queries, please contact us at: ${
            config.MAIL_FROM_ADDRESS
          }</p>
          <p>&copy; ${new Date().getFullYear()} EK PAHAL. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Email subjects
 */
const SUBJECTS = {
  DONATION_THANK_YOU: "Thank You for Your Generous Donation - EK PAHAL",
};

module.exports = {
  getDonationThankYouTemplate,
  SUBJECTS,
};

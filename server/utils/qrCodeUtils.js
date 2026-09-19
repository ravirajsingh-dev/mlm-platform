const QRCode = require("qrcode");
const crypto = require("crypto");

/**
 * Generate QR code with UPI payment details
 * @param {string} upi - UPI ID (e.g., "user@paytm")
 * @param {string} payeeName - Name of the payee
 * @param {number} amount - Amount to be paid
 * @param {object} options - Additional options
 * @param {string} options.transactionRef - Optional custom transaction reference
 * @param {string} options.token - Optional custom token
 * @returns {Promise<{qrCodeData: string, transactionRef: string, token: string, upiUrl: string}>}
 */
const generateQRCodeWithAmount = async (
  upi,
  payeeName,
  amount,
  options = {}
) => {
  try {
    // Validation
    if (!upi || typeof upi !== "string" || upi.trim() === "") {
      throw new Error("UPI ID is required and must be a non-empty string");
    }

    if (
      !payeeName ||
      typeof payeeName !== "string" ||
      payeeName.trim() === ""
    ) {
      throw new Error("Payee name is required and must be a non-empty string");
    }

    if (
      !amount ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !Number.isFinite(amount)
    ) {
      throw new Error("Amount is required and must be a positive number");
    }

    // Validate UPI format (basic validation)
    const upiPattern = /^[\w.-]+@[\w]+$/;
    if (!upiPattern.test(upi.trim())) {
      throw new Error("Invalid UPI ID format. Expected format: user@paytm");
    }

    // Generate transaction reference and token if not provided
    const transactionRef =
      options.transactionRef ||
      crypto.randomBytes(16).toString("hex").slice(0, 20);
    const token = options.token || crypto.randomBytes(16).toString("hex");

    // Format amount to 2 decimal places
    const formattedAmount = parseFloat(amount.toFixed(2));

    // Build UPI URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(
      upi.trim()
    )}&pn=${encodeURIComponent(
      payeeName.trim()
    )}&tr=${transactionRef}&am=${formattedAmount}&cu=INR&tn=${token}`;

    // Generate QR code as a base64 string with error correction level
    const qrCodeData = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 300,
    });

    return {
      qrCodeData,
      transactionRef,
      token,
      upiUrl,
      amount: formattedAmount,
    };
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

/**
 * Generate QR code for withdrawal request
 * @param {object} withdrawalRequest - Withdrawal request object
 * @param {string} withdrawalRequest.upiId - UPI ID
 * @param {string} withdrawalRequest.upiHolderName - UPI holder name
 * @param {number} withdrawalRequest.netPayableAmount - Net payable amount
 * @param {string} withdrawalRequest._id - Withdrawal request ID (optional, for transaction ref)
 * @returns {Promise<{qrCodeData: string, transactionRef: string, token: string, upiUrl: string}>}
 */
const generateWithdrawalQRCode = async (withdrawalRequest) => {
  try {
    if (!withdrawalRequest) {
      throw new Error("Withdrawal request is required");
    }

    const { upiId, upiHolderName, netPayableAmount, _id } = withdrawalRequest;

    if (!upiId || !upiHolderName || !netPayableAmount) {
      throw new Error(
        "Missing required withdrawal request fields: upiId, upiHolderName, or netPayableAmount"
      );
    }

    // Use withdrawal request ID as part of transaction reference for traceability
    const transactionRef = _id
      ? `${_id.toString().slice(-12)}${crypto.randomBytes(4).toString("hex")}`
      : undefined;

    return await generateQRCodeWithAmount(
      upiId,
      upiHolderName,
      netPayableAmount,
      {
        transactionRef,
      }
    );
  } catch (error) {
    console.error("Error generating withdrawal QR code:", error);
    throw error;
  }
};

module.exports = {
  generateQRCodeWithAmount,
  generateWithdrawalQRCode,
};
